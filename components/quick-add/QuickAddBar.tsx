"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, X, Check, Edit2, Loader2, Plus, Zap } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseCommand } from "@/lib/quick-add/parseCommand";
import { parseRetailCommand, fuzzyMatchProduct } from "@/lib/quick-add/parseRetailCommand";
import { financeTransactionAPI, financeCategoryAPI, financeAccountAPI } from "@/lib/api/personal-finance";
import type { FinanceCategory, FinanceAccount } from "@/lib/api/personal-finance";
import { inventoryApi } from "@/lib/api/inventory";
import type { Product } from "@/lib/api/inventory";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description?: string;
}

interface QuickAddBarProps {
  onTransactionAdded?: () => void;
}

export default function QuickAddBar({ onTransactionAdded }: QuickAddBarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  
  // For retail/kirana operations
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [retailParsedCommand, setRetailParsedCommand] = useState<any>(null);
  const [pendingItemData, setPendingItemData] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  // Determine if this is a personal account
  const isPersonal = user?.tenant?.account_type === "personal";
  const isRetailOrKirana = !isPersonal;

  // Load categories and accounts on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isPersonal) {
        const [fetchedCategories, fetchedAccounts] = await Promise.all([
          financeCategoryAPI.list(),
          financeAccountAPI.list(),
        ]);
        setCategories(fetchedCategories);
        setAccounts(fetchedAccounts);

        // Auto-select first account if available
        if (fetchedAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(fetchedAccounts[0].id);
        }
      } else {
        // Load products and warehouses for retail/kirana
        const [productsRes, warehousesRes] = await Promise.all([
          inventoryApi.products.list({ limit: 1000 }),
          inventoryApi.warehouses.list({ limit: 100 }),
        ]);
        
        const allProducts = productsRes.data?.results || [];
        const allWarehouses = warehousesRes.data?.results || [];
        
        setProducts(allProducts);
        setWarehouses(allWarehouses);

        // Auto-select first warehouse if available
        if (allWarehouses.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(allWarehouses[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  // Get quick action routes based on account type
  const getQuickActions = () => {
    if (isPersonal) {
      return [
        { label_en: "Add Expense", label_ne: "खर्च जोड्नुहोस्", href: "/dashboard/personal-finance/transactions?new=1&type=expense" },
        { label_en: "Add Income", label_ne: "आय जोड्नुहोस्", href: "/dashboard/personal-finance/transactions?new=1&type=income" },
        { label_en: "Pay a Bill", label_ne: "बिल तिर्नुहोस्", href: "/dashboard/personal-finance/bills?new=1" },
        { label_en: "Check Tax Estimate", label_ne: "कर अनुमान जाँच्नुहोस्", href: "/dashboard/personal-finance/tax" },
      ];
    } else {
      // Organization/Retail
      return [
        { label_en: "Add Expense", label_ne: "खर्च जोड्नुहोस्", href: "/dashboard/accounting/journal-entries?new=1&type=expense" },
        { label_en: "Add Income", label_ne: "आय जोड्नुहोस्", href: "/dashboard/sales/invoices?new=1" },
        { label_en: "Pay a Bill", label_ne: "बिल तिर्नुहोस्", href: "/dashboard/purchase/invoices?new=1" },
        { label_en: "Check Tax Estimate", label_ne: "कर अनुमान जाँच्नुहोस्", href: "/dashboard/accounting/tax-management" },
      ];
    }
  };

  const handleParse = async () => {
    if (!input.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setIsProcessing(true);
    setUsedAI(false);

    try {
      if (isPersonal) {
        // Personal finance: use original parser
        if (accounts.length === 0) {
          toast.error('Please create an account first');
          setIsProcessing(false);
          return;
        }

        const result = await parseCommand(
          input,
          categories.map(c => ({ name: c.name, type: c.type }))
        );

        if (result.success && result.data) {
          setParsedData(result.data);
          setUsedAI(result.usedAI || false);
        } else {
          toast.error(result.error || 'Could not understand the command');
        }
      } else {
        // Retail/Kirana: use retail parser
        const command = parseRetailCommand(input);

        if (command.error) {
          toast.error(command.error);
          setRetailParsedCommand(null);
        } else if (command.intent === 'unknown') {
          toast.error(command.error || 'Command not recognized');
          setRetailParsedCommand(null);
        } else {
          setRetailParsedCommand(command);
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse command');
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Can toggle to 'ne-NP' for Nepali

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast.error('Microphone not available');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleRetailAddItem = async () => {
    if (!retailParsedCommand || !retailParsedCommand.itemName) return;

    setIsSaving(true);
    try {
      const itemName = retailParsedCommand.itemName;
      
      // Check if item already exists
      const existingProduct = fuzzyMatchProduct(itemName, products);
      
      if (existingProduct) {
        toast.error(`${existingProduct.name} already exists in inventory (Stock: ${existingProduct.total_stock || 0} units)`);
        handleClose();
      } else {
        // Item doesn't exist - create it with default values
        // Required fields: name, unit, cost_price, selling_price
        // We'll use sensible defaults and let the user edit if needed
        
        try {
          // First, get a default unit (usually "Piece" or first available)
          const unitsRes = await inventoryApi.units.list();
          const units = unitsRes.data?.results || [];
          const defaultUnit = units.length > 0 ? units[0].id : 1;

          // Create the product with minimal required fields
          const newProduct = await inventoryApi.products.create({
            name: itemName,
            unit: defaultUnit,
            cost_price: 0,
            selling_price: 0,
            sku: itemName.toLowerCase().replace(/\s+/g, '-'),
            description: `Added via Quick Add`,
            status: 'active',
          });

          toast.success(`${itemName} added to inventory! Now add stock.`);
          
          // Refresh products list
          await loadData();
          
          // Close modal and show next step
          handleClose();
          
          // Optionally navigate to product edit page
          setTimeout(() => {
            router.push(`/dashboard/inventory/products/${newProduct?.id}`);
          }, 1000);
        } catch (err: any) {
          console.error('Error creating product:', err);
          toast.error(err.response?.data?.detail || 'Failed to create item');
        }
      }
    } catch (error) {
      console.error('Error checking item:', error);
      toast.error('Failed to process item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetailRestock = async () => {
    if (!retailParsedCommand || !retailParsedCommand.itemName || !retailParsedCommand.quantity) return;

    setIsSaving(true);
    try {
      const itemName = retailParsedCommand.itemName;
      const quantity = retailParsedCommand.quantity;
      
      // Check if item exists
      const existingProduct = fuzzyMatchProduct(itemName, products);
      
      if (!existingProduct) {
        toast.error(`"${itemName}" isn't in inventory yet. Want to add it first?`);
        setRetailParsedCommand(null);
        setPendingItemData(null);
        setInput('');
      } else {
        // Restock the item
        if (!selectedWarehouse) {
          toast.error('No warehouse selected');
          return;
        }

        const productId = Number(existingProduct.id);

        await inventoryApi.operations.stockIn({
          product: productId,
          warehouse: selectedWarehouse,
          quantity: quantity.toString(),
          reason: 'New order received',
          notes: `Added via quick add: ${input}`,
        });

        toast.success(`Added ${quantity} units to ${existingProduct.name}. New stock: ${(existingProduct.total_stock || 0) + quantity}`);
        
        // Refresh the page to show updated inventory
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        handleClose();
      }
    } catch (error) {
      console.error('Error restocking item:', error);
      toast.error('Failed to restock item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRetailAction = async () => {
    if (!retailParsedCommand) return;

    if (retailParsedCommand.intent === 'add-item') {
      await handleRetailAddItem();
    } else if (retailParsedCommand.intent === 'restock') {
      await handleRetailRestock();
    }
  };

  const handleConfirm = async () => {
    if (isPersonal) {
      // Personal finance flow
      if (!parsedData || !selectedAccount) {
        toast.error('Please select an account');
        return;
      }

      setIsSaving(true);

      try {
        // Find category ID from name
        const category = categories.find(c => c.name === parsedData.category);
        
        if (!category) {
          toast.error('Category not found');
          setIsSaving(false);
          return;
        }

        // Create transaction via API
        const transactionData = {
          type: parsedData.type,
          amount: parsedData.amount.toString(),
          category: category.id,
          account: selectedAccount,
          date: parsedData.date,
          description: parsedData.description || input,
        };

        await financeTransactionAPI.create(transactionData);

        toast.success(`Transaction added: ${parsedData.type === 'income' ? '+' : '-'}Rs. ${parsedData.amount}`);
        
        // Reset and close
        handleClose();

        // Notify parent to refresh data
        if (onTransactionAdded) {
          onTransactionAdded();
        }
      } catch (error: any) {
        console.error('Failed to create transaction:', error);
        toast.error(error.response?.data?.detail || 'Failed to add transaction');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Retail/Kirana flow
      await handleConfirmRetailAction();
    }
  };

  const handleCancel = () => {
    setParsedData(null);
    setRetailParsedCommand(null);
    setPendingItemData(null);
    setUsedAI(false);
  };

  const handleEdit = () => {
    setParsedData(null);
    setRetailParsedCommand(null);
    setPendingItemData(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setInput('');
    setParsedData(null);
    setRetailParsedCommand(null);
    setPendingItemData(null);
    setUsedAI(false);
  };

  return (
    <>
      {/* Floating Quick Add Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-40 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="Quick Add Transaction (type or speak)"
      >
        <Zap className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Quick Action Pills */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-wrap gap-2 max-w-xs">
        {getQuickActions().map((action, idx) => (
          <button
            key={idx}
            onClick={() => router.push(action.href)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition text-xs font-medium text-gray-900 whitespace-nowrap"
          >
            {action.label_ne}
          </button>
        ))}
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Quick Add Transaction
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Input Bar */}
            {!parsedData && !retailParsedCommand && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isProcessing) {
                          handleParse();
                        }
                      }}
                      placeholder={isPersonal ? "Type or speak: 'add 5000 to rent', 'spent 300 on groceries'..." : "Type or speak: 'add momo to inventory', 'add 500 new stock to momo'..."}
                      className="pr-10 focus-visible:ring-0 focus-visible:border-[#1e3a8a]"
                      disabled={isListening || isProcessing}
                      autoFocus
                    />
                    {isListening && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Mic Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant={isListening ? "default" : "outline"}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>

                  {/* Parse Button */}
                  <Button
                    type="button"
                    onClick={handleParse}
                    disabled={!input.trim() || isProcessing || isListening}
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>

                {/* Listening State */}
                {isListening && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Listening...
                  </p>
                )}
              </div>
            )}

            {/* Confirmation Card - Personal Finance */}
            {isPersonal && parsedData && (
              <div className="bg-white border-2 border-[#1e3a8a] rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Confirm Transaction</h3>
                    {usedAI && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        ⚠️ Parsed using AI - please verify details
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Type:</span>
                    <span className={`font-medium ${parsedData.type === 'income' ? 'text-[#22C55E]' : 'text-red-600'}`}>
                      {parsedData.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Amount:</span>
                    <span className="font-bold text-lg">
                      {parsedData.type === 'income' ? '+' : '-'}Rs. {parsedData.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="font-medium">{parsedData.category}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="font-medium">
                      {new Date(parsedData.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Account:</span>
                    <Select
                      value={selectedAccount?.toString() || ''}
                      onValueChange={(value) => setSelectedAccount(parseInt(value))}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isSaving}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSaving || !selectedAccount}
                    className="bg-[#22C55E] hover:bg-[#22C55E]/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmation Card - Retail/Kirana */}
            {!isPersonal && retailParsedCommand && (
              <div className="bg-white border-2 border-[#22C55E] rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {retailParsedCommand.intent === 'add-item' ? 'Add Item to Inventory' : 'Restock Item'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Item:</span>
                    <span className="font-medium">{retailParsedCommand.itemName}</span>
                  </div>

                  {retailParsedCommand.intent === 'restock' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className="font-medium">{retailParsedCommand.quantity} units</span>
                    </div>
                  )}

                  {warehouses.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Warehouse:</span>
                      <Select
                        value={selectedWarehouse?.toString() || ''}
                        onValueChange={(value) => setSelectedWarehouse(parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isSaving}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSaving || !selectedWarehouse}
                    className="bg-[#22C55E] hover:bg-[#22C55E]/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
