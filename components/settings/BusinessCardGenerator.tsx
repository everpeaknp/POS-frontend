"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getMediaUrl } from "@/lib/utils";

interface BusinessCardData {
  companyName: string;
  businessType: string;
  phone: string;
  email: string;
  address: string;
  pan: string;
  logo?: string;
}

interface TemplateProps {
  data: BusinessCardData;
}

// Modern Template (left-aligned text = logo on right)
const ModernCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90 mb-2">{data.businessType}</p>
        <div className="h-1 w-16 bg-white/50"></div>
      </div>
      <div className="w-16 h-16 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5 opacity-90">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Classic Template (center-aligned text = logo in center)
const ClassicCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between border-4 border-gray-800">
    <div className="text-center">
      {data.logo && (
        <img src={data.logo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2" />
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{data.companyName}</h2>
      <p className="text-sm text-gray-600 mb-2">{data.businessType}</p>
      <div className="h-px bg-gray-400 w-24 mx-auto"></div>
    </div>
    <div className="text-center">
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Minimal Template (left-aligned text = logo on right)
const MinimalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gray-50 p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">{data.companyName}</h2>
        <p className="text-xs text-gray-600">{data.businessType}</p>
      </div>
      {data.logo && (
        <img src={data.logo} alt="Logo" className="w-12 h-12 object-contain ml-3" />
      )}
    </div>
    <div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Bold Template (left-aligned text = logo on right)
const BoldCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-black text-white p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-3xl font-black mb-1">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
        <div className="h-2 w-20 bg-yellow-400"></div>
      </div>
      <div className="w-16 h-16 bg-white/10 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Elegant Template (right-aligned text = logo on left)
const ElegantCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="w-14 h-14 bg-purple-200 rounded-lg p-2 mr-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-purple-700">LOGO</span>
        )}
      </div>
      <div className="text-right flex-1">
        <h2 className="text-2xl font-serif font-bold text-purple-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-purple-700 mb-2">{data.businessType}</p>
        <div className="h-px bg-purple-300 w-24 ml-auto"></div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-xs text-purple-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Corporate Template (left-aligned text = logo on right)
const CorporateCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white flex">
    <div className="w-2 bg-gradient-to-b from-blue-700 to-blue-900"></div>
    <div className="flex-1 p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">{data.companyName}</h2>
          <p className="text-xs text-gray-500">{data.businessType}</p>
        </div>
        <div className="w-14 h-14 bg-blue-50 rounded p-2 ml-4 flex items-center justify-center">
          {data.logo ? (
            <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs font-bold text-blue-700">LOGO</span>
          )}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>{data.phone}</p>
          <p>{data.email}</p>
          <p>{data.address}</p>
          <p>PAN: {data.pan}</p>
        </div>
      </div>
    </div>
  </div>
);

// Creative Template (left-aligned text = logo on right)
const CreativeCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10">
      <div className="text-xs space-y-0.5 opacity-90">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Simple Template (left-aligned text = logo on right)
const SimpleCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-center border border-gray-300">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{data.companyName}</h2>
        <p className="text-sm text-gray-600 mb-3">{data.businessType}</p>
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded p-2 ml-3 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-gray-500">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-gray-600 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Luxury Template (center-aligned text = logo in center)
const LuxuryCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-yellow-50 p-6 flex flex-col justify-between border-2 border-amber-600">
    <div className="text-center">
      <div className="w-14 h-14 bg-amber-200 rounded-lg p-2 mx-auto mb-2 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-amber-800">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-serif font-bold text-amber-900 mb-1">{data.companyName}</h2>
      <p className="text-sm text-amber-700 mb-2">{data.businessType}</p>
      <div className="h-px bg-amber-600 w-32 mx-auto"></div>
    </div>
    <div className="text-center">
      <div className="text-xs text-amber-700 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);
// Tech Template (left-aligned text = logo on right)
const TechCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-700 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 font-mono">{data.companyName}</h2>
        <p className="text-sm opacity-90 mb-2 font-mono">{data.businessType}</p>
        <div className="h-1 w-24 bg-cyan-300"></div>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5 opacity-90 font-mono">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Vibrant Template (left-aligned text = logo on right)
const VibrantCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-3xl font-extrabold mb-1">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
      </div>
      <div className="w-16 h-16 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);
// Professional Template (left-aligned text = logo on right)
const ProfessionalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-gray-600 mb-2">{data.businessType}</p>
        <div className="h-1 w-12 bg-blue-600"></div>
      </div>
      <div className="w-14 h-14 bg-gray-100 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-gray-600">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);
// Nepali Traditional Template (center-aligned = logo in center)
const NepaliTraditionalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-600 p-6 text-white flex flex-col justify-between border-4 border-yellow-500">
    <div className="text-center">
      <div className="w-14 h-14 bg-yellow-400 rounded-full p-2 mx-auto mb-2 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-800">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
      <p className="text-sm mb-2">{data.businessType}</p>
      <div className="h-1 w-24 bg-yellow-400 mx-auto"></div>
    </div>
    <div className="text-center">
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Festival Template (left-aligned = logo on right)
const NepaliFestivalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
        <div className="h-1 w-20 bg-yellow-300"></div>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Business Template (left-aligned = logo on right)
const NepaliBusinessCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between border-l-8 border-red-600">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{data.companyName}</h2>
        <p className="text-xs text-gray-500">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-red-50 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-600">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Retail Template (left-aligned = logo on right)
const NepaliRetailCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-xs opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Restaurant Template (left-aligned = logo on right)
const NepaliRestaurantCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-16 h-16 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Construction Template (left-aligned = logo on right)
const NepaliConstructionCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 p-6 text-white flex flex-col justify-between border-4 border-orange-500">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
        <div className="h-1 w-20 bg-orange-500"></div>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Tech Template (left-aligned = logo on right)
const NepaliTechCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 font-mono">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
        <div className="h-1 w-24 bg-cyan-400"></div>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div>
      <div className="text-xs space-y-0.5 font-mono">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
        <p>PAN: {data.pan}</p>
      </div>
    </div>
  </div>
);

// Nepali Professional Template (left-aligned = logo on right)
const NepaliProfessionalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex">
    <div className="w-3 bg-gradient-to-b from-blue-700 via-red-600 to-blue-700 mr-4"></div>
    <div className="flex-1 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{data.companyName}</h2>
          <p className="text-xs text-gray-500">{data.businessType}</p>
        </div>
        <div className="w-14 h-14 bg-gray-100 rounded p-2 ml-4 flex items-center justify-center">
          {data.logo ? (
            <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs font-bold text-gray-600">LOGO</span>
          )}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>{data.phone}</p>
          <p>{data.email}</p>
          <p>{data.address}</p>
          <p>PAN: {data.pan}</p>
        </div>
      </div>
    </div>
  </div>
);

// Gradient Flow Template
const GradientFlowCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90 mb-2">{data.businessType}</p>
        <div className="h-0.5 w-16 bg-white/60"></div>
      </div>
      <div className="w-14 h-14 bg-white/20 rounded-lg p-2 ml-4 flex items-center justify-center backdrop-blur-sm">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Dark Executive Template
const DarkExecutiveCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white flex flex-col justify-between border border-slate-700">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1 text-amber-400">{data.companyName}</h2>
        <p className="text-xs text-slate-300">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-slate-700/50 rounded p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-amber-400">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-slate-300 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Artistic Template
const ArtisticCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-tr from-rose-100 via-purple-100 to-cyan-100 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
    </div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-full p-2 mx-auto mb-2 flex items-center justify-center border-2 border-purple-300">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-purple-700">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-purple-900 mb-1">{data.companyName}</h2>
      <p className="text-sm text-purple-700">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs text-purple-800 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Neon Template
const NeonCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-black p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-pink-500/10"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 text-cyan-400" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>{data.companyName}</h2>
        <p className="text-sm text-pink-400 mb-2">{data.businessType}</p>
        <div className="h-0.5 w-20 bg-gradient-to-r from-cyan-400 to-pink-400"></div>
      </div>
      <div className="w-14 h-14 bg-gray-900 rounded p-2 ml-4 flex items-center justify-center border border-cyan-400/50">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-cyan-400">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-gray-300 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Geometric Template
const GeometricCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500 opacity-20 -ml-10 -mt-10 rotate-45"></div>
    <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 opacity-20 -mr-12 -mb-12 rotate-12"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-emerald-600 font-medium">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-emerald-100 rounded-lg p-2 ml-4 flex items-center justify-center rotate-3">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-emerald-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-gray-700 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Nature Template
const NatureCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-green-50 to-teal-50 p-6 flex flex-col justify-between border-2 border-green-200">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-green-800 mb-1">{data.companyName}</h2>
        <p className="text-sm text-green-600">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white rounded-full p-2 ml-4 flex items-center justify-center shadow-sm">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-green-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-green-700 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Split Tone Template
const SplitToneCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full flex overflow-hidden">
    <div className="w-1/3 bg-gradient-to-b from-indigo-600 to-indigo-800 p-4 flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 bg-white/20 rounded-lg p-2 mb-3 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
      <p className="text-xs text-center opacity-90">PAN: {data.pan}</p>
    </div>
    <div className="w-2/3 bg-white p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-indigo-600">{data.businessType}</p>
      </div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{data.phone}</p>
        <p>{data.email}</p>
        <p>{data.address}</p>
      </div>
    </div>
  </div>
);

// Minimal Border Template
const MinimalBorderCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between border-4 border-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-gray-900 p-2 mx-auto mb-2 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-wider">{data.companyName}</h2>
      <p className="text-xs text-gray-600 uppercase tracking-wide">{data.businessType}</p>
    </div>
    <div className="text-center text-xs text-gray-700 space-y-0.5 border-t border-gray-300 pt-3">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Retro Template
const RetroCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 p-6 flex flex-col justify-between border-4 border-orange-800">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-orange-900 mb-1" style={{ fontFamily: 'serif' }}>{data.companyName}</h2>
        <p className="text-sm text-orange-800">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-orange-800 rounded-full p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-amber-200">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-orange-900 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Futuristic Template
const FuturisticCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 92, 246, 0.1) 2px, rgba(139, 92, 246, 0.1) 4px)' }}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1 font-mono text-purple-300">{data.companyName}</h2>
        <p className="text-xs opacity-80 font-mono">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-purple-500/20 rounded p-2 ml-4 flex items-center justify-center border border-purple-500/50">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-purple-400">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs opacity-90 font-mono space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Ocean Wave Template
const OceanWaveCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/20 rounded-t-full"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 drop-shadow-md">{data.companyName}</h2>
        <p className="text-sm mb-2">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-full p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Sunset Template
const SunsetCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-400 to-purple-500 p-6 text-white flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs space-y-0.5 bg-white/10 backdrop-blur-sm p-3 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Industrial Template
const IndustrialCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-zinc-800 p-6 text-white flex flex-col justify-between relative overflow-hidden border-l-4 border-yellow-500">
    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 -mr-16 -mt-16 rotate-45"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1 uppercase tracking-wide">{data.companyName}</h2>
        <p className="text-xs text-yellow-400 uppercase tracking-wider">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-zinc-700 rounded p-2 ml-4 flex items-center justify-center border border-yellow-500/50">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-yellow-500">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-zinc-300 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Marble Template
const MarbleCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(156, 163, 175, 0.8) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(156, 163, 175, 0.6) 0%, transparent 50%)' }}></div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-white rounded-full p-2 mx-auto mb-2 flex items-center justify-center shadow-lg border border-gray-300">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-gray-700">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">{data.companyName}</h2>
      <p className="text-sm text-gray-700">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs text-gray-800 space-y-0.5 bg-white/50 p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Rainbow Template
const RainbowCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between border-t-8 border-r-8 border-b-8 border-l-8" style={{ borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%) 1' }}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-1">{data.companyName}</h2>
        <p className="text-sm text-gray-700">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-purple-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-gray-700 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Newspaper Template
const NewspaperCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-yellow-50 p-6 flex flex-col justify-between border-2 border-gray-900">
    <div className="flex justify-between items-start border-b-4 border-double border-gray-900 pb-2">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase" style={{ fontFamily: 'serif' }}>{data.companyName}</h2>
        <p className="text-xs text-gray-700 uppercase tracking-wide">{data.businessType}</p>
      </div>
      <div className="w-12 h-12 border-2 border-gray-900 p-1 ml-3 flex items-center justify-center bg-white">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="text-xs text-gray-800 space-y-0.5 font-mono">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Crystal Template
const CrystalCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-cyan-100 via-blue-100 to-purple-100 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-400 -ml-12 -mt-12" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-400 -mr-10 -mb-10" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-blue-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-blue-700">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/60 backdrop-blur-sm rounded p-2 ml-4 flex items-center justify-center shadow-lg">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-blue-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-blue-900 space-y-0.5">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Cyberpunk Template
const CyberpunkCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-black p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px), linear-gradient(180deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-pink-500 mb-1 font-mono" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}>{data.companyName}</h2>
        <p className="text-sm text-cyan-400 font-mono">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-pink-500/20 rounded p-2 ml-4 flex items-center justify-center border-2 border-pink-500/50">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-pink-500">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-cyan-300 font-mono space-y-0.5 border-l-2 border-pink-500 pl-2">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Watercolor Template
const WatercolorCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full p-6 flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(255, 218, 185, 0.3) 25%, rgba(221, 160, 221, 0.3) 50%, rgba(176, 224, 230, 0.3) 75%, rgba(255, 250, 205, 0.3) 100%)' }}>
    <div className="absolute inset-0 opacity-40">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300 rounded-full blur-3xl"></div>
    </div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full p-2 mx-auto mb-2 flex items-center justify-center shadow-md">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-purple-700">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-purple-900 mb-1" style={{ fontFamily: 'cursive' }}>{data.companyName}</h2>
      <p className="text-sm text-purple-700">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs text-purple-900 space-y-0.5 bg-white/50 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Wood Grain Template
const WoodGrainCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-6 text-amber-50 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)' }}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1 text-amber-100">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-amber-200 rounded-lg p-2 ml-4 flex items-center justify-center shadow-lg">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-amber-900">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 bg-black/20 p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Himalaya Mountain Template
const HimalayaCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-b from-blue-900 via-blue-700 to-white p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute bottom-0 left-0 right-0 h-32" style={{ 
      background: 'linear-gradient(to top, white 0%, transparent 100%)',
      clipPath: 'polygon(0 100%, 0 60%, 10% 50%, 20% 55%, 30% 45%, 40% 50%, 50% 40%, 60% 45%, 70% 35%, 80% 40%, 90% 30%, 100% 35%, 100% 100%)'
    }}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full p-2 ml-4 flex items-center justify-center border-2 border-white/40">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 bg-blue-900/30 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Dashain Festival Template
const DashainCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-red-700 via-orange-600 to-yellow-500 p-6 text-white flex flex-col justify-between relative overflow-hidden border-4 border-yellow-400">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-2 right-2 w-12 h-12 border-4 border-white rounded-full"></div>
      <div className="absolute bottom-3 left-3 w-8 h-8 border-4 border-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/4 w-6 h-6 border-4 border-white rounded-full"></div>
    </div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-yellow-400 rounded-full p-2 mx-auto mb-2 flex items-center justify-center border-2 border-white shadow-lg">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-800">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold mb-1 drop-shadow-md">{data.companyName}</h2>
      <p className="text-sm">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs space-y-0.5 bg-red-900/40 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Tihar Diya Template
const TiharCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-orange-800 via-amber-700 to-yellow-600 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-4 left-4 w-3 h-6 bg-yellow-300 rounded-t-full"></div>
      <div className="absolute top-4 right-8 w-3 h-6 bg-yellow-300 rounded-t-full"></div>
      <div className="absolute bottom-6 left-1/3 w-3 h-6 bg-yellow-300 rounded-t-full"></div>
      <div className="absolute top-1/2 right-6 w-3 h-6 bg-yellow-300 rounded-t-full"></div>
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-yellow-400 rounded-full p-2 ml-4 flex items-center justify-center shadow-xl">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-orange-900">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 bg-orange-900/50 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Nepali Dhaka Pattern Template
const DhakaPatternCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-white p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
        {[...Array(48)].map((_, i) => (
          <div key={i} className="border border-red-600" style={{ 
            background: i % 3 === 0 ? 'linear-gradient(45deg, #dc2626 25%, transparent 25%, transparent 75%, #dc2626 75%)' : 
                       i % 3 === 1 ? 'linear-gradient(-45deg, #0891b2 25%, transparent 25%, transparent 75%, #0891b2 75%)' : 
                       'linear-gradient(90deg, #16a34a 25%, transparent 25%, transparent 75%, #16a34a 75%)',
            backgroundSize: '8px 8px'
          }}></div>
        ))}
      </div>
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-red-700 mb-1">{data.companyName}</h2>
        <p className="text-sm text-gray-700">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-red-100 rounded p-2 ml-4 flex items-center justify-center border-2 border-red-600">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-gray-800 space-y-0.5 border-t-2 border-red-600 pt-2">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Buddhist Mandala Template
const MandalaCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center opacity-10">
      <div className="w-40 h-40 rounded-full border-8 border-orange-600 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-yellow-600 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-600"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-white rounded-full p-2 mx-auto mb-2 flex items-center justify-center shadow-lg border-2 border-orange-600">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-orange-700">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-orange-900 mb-1">{data.companyName}</h2>
      <p className="text-sm text-orange-800">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs text-orange-900 space-y-0.5 bg-white/60 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Temple Architecture Template
const TempleCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-4 bg-red-700"></div>
    <div className="absolute top-4 left-0 right-0 h-2 bg-yellow-600"></div>
    <div className="relative z-10 flex justify-between items-start mt-4">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-red-700 p-2 ml-4 flex items-center justify-center border-2 border-yellow-600">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-yellow-400">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 bg-amber-950/60 p-2 rounded border-l-4 border-red-700">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Prayer Flags Template
const PrayerFlagsCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-sky-200 to-sky-100 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 flex">
      <div className="flex-1 h-2 bg-blue-600"></div>
      <div className="flex-1 h-2 bg-white"></div>
      <div className="flex-1 h-2 bg-red-600"></div>
      <div className="flex-1 h-2 bg-green-600"></div>
      <div className="flex-1 h-2 bg-yellow-500"></div>
    </div>
    <div className="relative z-10 flex justify-between items-start mt-2">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-blue-900 mb-1">{data.companyName}</h2>
        <p className="text-sm text-blue-800">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white rounded-lg p-2 ml-4 flex items-center justify-center shadow-md border border-blue-300">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-blue-700">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs text-blue-900 space-y-0.5 bg-white/70 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Newari Culture Template
const NewariCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-red-800 to-red-950 p-6 text-white flex flex-col justify-between relative overflow-hidden border-4 border-amber-600">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-4 left-4 w-8 h-8" style={{ borderTop: '4px solid white', borderLeft: '4px solid white' }}></div>
      <div className="absolute top-4 right-4 w-8 h-8" style={{ borderTop: '4px solid white', borderRight: '4px solid white' }}></div>
      <div className="absolute bottom-4 left-4 w-8 h-8" style={{ borderBottom: '4px solid white', borderLeft: '4px solid white' }}></div>
      <div className="absolute bottom-4 right-4 w-8 h-8" style={{ borderBottom: '4px solid white', borderRight: '4px solid white' }}></div>
    </div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-1 text-amber-300">{data.companyName}</h2>
        <p className="text-sm opacity-90">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-amber-600 p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-900">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 border-t-2 border-amber-600 pt-2">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Everest Sunrise Template
const EverestCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-b from-orange-400 via-pink-300 to-blue-900 p-6 text-white flex flex-col justify-between relative overflow-hidden">
    <div className="absolute bottom-0 left-0 right-0 h-40" style={{ 
      background: 'linear-gradient(to top, #1e3a8a 0%, transparent 100%)',
      clipPath: 'polygon(0 100%, 0 40%, 15% 35%, 30% 45%, 45% 30%, 50% 25%, 55% 30%, 70% 40%, 85% 35%, 100% 40%, 100% 100%)'
    }}></div>
    <div className="absolute top-4 right-8 w-16 h-16 bg-yellow-300 rounded-full opacity-80"></div>
    <div className="relative z-10 flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">{data.companyName}</h2>
        <p className="text-sm">{data.businessType}</p>
      </div>
      <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-lg p-2 ml-4 flex items-center justify-center">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold">LOGO</span>
        )}
      </div>
    </div>
    <div className="relative z-10 text-xs space-y-0.5 bg-blue-900/60 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

// Rhododendron (National Flower) Template
const RhododendronCard = ({ data }: TemplateProps) => (
  <div className="w-full h-full bg-gradient-to-br from-pink-100 via-red-100 to-rose-100 p-6 flex flex-col justify-between relative overflow-hidden">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-2 right-4 w-12 h-12 rounded-full bg-red-400"></div>
      <div className="absolute top-8 right-10 w-8 h-8 rounded-full bg-pink-400"></div>
      <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-red-400"></div>
      <div className="absolute bottom-12 left-12 w-6 h-6 rounded-full bg-pink-400"></div>
      <div className="absolute top-1/2 left-1/3 w-14 h-14 rounded-full bg-rose-400"></div>
    </div>
    <div className="relative z-10 text-center">
      <div className="w-16 h-16 bg-white rounded-full p-2 mx-auto mb-2 flex items-center justify-center shadow-lg border-2 border-red-400">
        {data.logo ? (
          <img src={data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-xs font-bold text-red-600">LOGO</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-red-800 mb-1">{data.companyName}</h2>
      <p className="text-sm text-red-700">{data.businessType}</p>
    </div>
    <div className="relative z-10 text-center text-xs text-red-900 space-y-0.5 bg-white/60 backdrop-blur-sm p-2 rounded">
      <p>{data.phone}</p>
      <p>{data.email}</p>
      <p>{data.address}</p>
      <p>PAN: {data.pan}</p>
    </div>
  </div>
);

const templates = [
  // International Templates
  { id: "modern", name: "Modern", component: ModernCard, category: "international" },
  { id: "classic", name: "Classic", component: ClassicCard, category: "international" },
  { id: "minimal", name: "Minimal", component: MinimalCard, category: "international" },
  { id: "bold", name: "Bold", component: BoldCard, category: "international" },
  { id: "elegant", name: "Elegant", component: ElegantCard, category: "international" },
  { id: "corporate", name: "Corporate", component: CorporateCard, category: "international" },
  { id: "creative", name: "Creative", component: CreativeCard, category: "international" },
  { id: "simple", name: "Simple", component: SimpleCard, category: "international" },
  { id: "luxury", name: "Luxury", component: LuxuryCard, category: "international" },
  { id: "tech", name: "Tech", component: TechCard, category: "international" },
  { id: "vibrant", name: "Vibrant", component: VibrantCard, category: "international" },
  { id: "professional", name: "Professional", component: ProfessionalCard, category: "international" },
  { id: "gradient-flow", name: "Gradient Flow", component: GradientFlowCard, category: "international" },
  { id: "dark-executive", name: "Dark Executive", component: DarkExecutiveCard, category: "international" },
  { id: "artistic", name: "Artistic", component: ArtisticCard, category: "international" },
  { id: "neon", name: "Neon", component: NeonCard, category: "international" },
  { id: "geometric", name: "Geometric", component: GeometricCard, category: "international" },
  { id: "nature", name: "Nature", component: NatureCard, category: "international" },
  { id: "split-tone", name: "Split Tone", component: SplitToneCard, category: "international" },
  { id: "minimal-border", name: "Minimal Border", component: MinimalBorderCard, category: "international" },
  { id: "retro", name: "Retro", component: RetroCard, category: "international" },
  { id: "futuristic", name: "Futuristic", component: FuturisticCard, category: "international" },
  { id: "ocean-wave", name: "Ocean Wave", component: OceanWaveCard, category: "international" },
  { id: "sunset", name: "Sunset", component: SunsetCard, category: "international" },
  { id: "industrial", name: "Industrial", component: IndustrialCard, category: "international" },
  { id: "marble", name: "Marble", component: MarbleCard, category: "international" },
  { id: "rainbow", name: "Rainbow", component: RainbowCard, category: "international" },
  { id: "newspaper", name: "Newspaper", component: NewspaperCard, category: "international" },
  { id: "crystal", name: "Crystal", component: CrystalCard, category: "international" },
  { id: "cyberpunk", name: "Cyberpunk", component: CyberpunkCard, category: "international" },
  { id: "watercolor", name: "Watercolor", component: WatercolorCard, category: "international" },
  { id: "wood-grain", name: "Wood Grain", component: WoodGrainCard, category: "international" },
  // Nepali Cultural Templates
  { id: "himalaya", name: "Himalaya Mountains", component: HimalayaCard, category: "nepali" },
  { id: "dashain", name: "Dashain Festival", component: DashainCard, category: "nepali" },
  { id: "tihar", name: "Tihar Diya", component: TiharCard, category: "nepali" },
  { id: "dhaka-pattern", name: "Dhaka Pattern", component: DhakaPatternCard, category: "nepali" },
  { id: "mandala", name: "Buddhist Mandala", component: MandalaCard, category: "nepali" },
  { id: "temple", name: "Temple Architecture", component: TempleCard, category: "nepali" },
  { id: "prayer-flags", name: "Prayer Flags", component: PrayerFlagsCard, category: "nepali" },
  { id: "newari", name: "Newari Culture", component: NewariCard, category: "nepali" },
  { id: "everest", name: "Everest Sunrise", component: EverestCard, category: "nepali" },
  { id: "rhododendron", name: "Rhododendron", component: RhododendronCard, category: "nepali" },
  { id: "nepali-traditional", name: "Nepali Traditional", component: NepaliTraditionalCard, category: "nepali" },
  { id: "nepali-festival", name: "Nepali Festival", component: NepaliFestivalCard, category: "nepali" },
  { id: "nepali-business", name: "Nepali Business", component: NepaliBusinessCard, category: "nepali" },
  { id: "nepali-retail", name: "Nepali Retail", component: NepaliRetailCard, category: "nepali" },
  { id: "nepali-restaurant", name: "Nepali Restaurant", component: NepaliRestaurantCard, category: "nepali" },
  { id: "nepali-construction", name: "Nepali Construction", component: NepaliConstructionCard, category: "nepali" },
  { id: "nepali-tech", name: "Nepali Tech", component: NepaliTechCard, category: "nepali" },
  { id: "nepali-professional", name: "Nepali Professional", component: NepaliProfessionalCard, category: "nepali" },
];

export function BusinessCardGenerator({ tenant, logoUrl }: { tenant: any; logoUrl?: string | null }) {
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [downloading, setDownloading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Construct full address from form fields
  const fullAddress = [
    tenant?.street,
    tenant?.city,
    tenant?.district,
    tenant?.province
  ].filter(Boolean).join(", ") || "Address";

  const cardData: BusinessCardData = {
    companyName: tenant?.name || "Company Name",
    businessType: tenant?.business_type || "Business Type",
    phone: tenant?.phone || "+977 1234567890",
    email: tenant?.email || "email@company.com",
    address: fullAddress,
    pan: tenant?.pan_vat_number || "PAN: 000000000",
    // Use logoUrl from parent component (existingLogoUrl)
    logo: logoUrl || undefined,
  };

  // Debug: Log to see form data
  console.log("Form tenant data:", tenant);
  console.log("Logo URL:", logoUrl);
  console.log("Card data:", cardData);

  const SelectedTemplate = templates.find((t) => t.id === selectedTemplate)?.component || ModernCard;

  const exportAsImage = async (format: "png" | "jpeg") => {
    if (!cardRef.current) return;

    try {
      setDownloading(true);
      const scale = 2.5;
      const node = cardRef.current;

      const dataUrl = format === "png" 
        ? await domtoimage.toPng(node, { width: 1050, height: 600, style: { transform: `scale(${scale})`, transformOrigin: "top left" } })
        : await domtoimage.toJpeg(node, { quality: 0.95, width: 1050, height: 600, style: { transform: `scale(${scale})`, transformOrigin: "top left" } });

      const link = document.createElement("a");
      link.download = `business-card.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export card");
    } finally {
      setDownloading(false);
    }
  };

  const exportAsPDF = async () => {
    if (!cardRef.current) return;

    try {
      setDownloading(true);
      const scale = 2.5;
      const node = cardRef.current;

      const dataUrl = await domtoimage.toPng(node, { 
        width: 1050, 
        height: 600, 
        style: { transform: `scale(${scale})`, transformOrigin: "top left" } 
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [88.9, 50.8], // 3.5" x 2" in mm
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 88.9, 50.8);
      pdf.save("business-card.pdf");

      toast.success("Downloaded as PDF");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!cardRef.current) return;

    try {
      const scale = 2.5;
      const node = cardRef.current;
      const dataUrl = await domtoimage.toPng(node, { 
        width: 1050, 
        height: 600, 
        style: { transform: `scale(${scale})`, transformOrigin: "top left" } 
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Business Card</title>
            <style>
              @media print {
                @page { size: 3.5in 2in; margin: 0; }
                body { margin: 0; padding: 0; }
                img { width: 3.5in; height: 2in; display: block; }
              }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { width: 3.5in; height: 2in; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print card");
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      const scale = 2.5;
      const node = cardRef.current;
      const dataUrl = await domtoimage.toBlob(node, { 
        width: 1050, 
        height: 600, 
        style: { transform: `scale(${scale})`, transformOrigin: "top left" } 
      });

      const file = new File([dataUrl], "business-card.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Business Card",
          text: "Check out my business card",
        });
        toast.success("Shared successfully");
      } else {
        toast.error("Sharing not supported on this device");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share card");
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <h4 className="font-semibold text-lg mb-6">Business Card Generator</h4>
        
        <div className="grid grid-cols-[380px_1fr] gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Template Selector Button */}
            <div>
              <label className="text-sm font-medium block mb-2">Select Template</label>
              <Button
                onClick={() => setShowTemplates(!showTemplates)}
                variant="outline"
                className="w-full h-12 justify-between text-left font-normal"
              >
                <span>{templates.find((t) => t.id === selectedTemplate)?.name || "Select a template"}</span>
                <span className="text-xs text-gray-500">{showTemplates ? "▲" : "▼"}</span>
              </Button>
            </div>

            {/* Template Grid Dropdown */}
            {showTemplates && (
              <div className="border rounded-lg p-3 bg-gray-50 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">International Templates</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.filter(t => t.category === "international").map((template) => {
                      const TemplateComponent = template.component;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template.id);
                          }}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedTemplate === template.id
                              ? "border-[#22C55E] shadow-lg"
                              : "border-gray-200 hover:border-[#22C55E] hover:shadow-md"
                          }`}
                        >
                          <div className="w-full aspect-[7/4] bg-white overflow-hidden">
                            <div style={{ transform: 'scale(0.19)', transformOrigin: 'top left', width: '420px', height: '240px' }}>
                              <TemplateComponent data={cardData} />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-semibold px-1.5 py-0.5 bg-black/50 rounded">
                              {template.name}
                            </span>
                          </div>
                          {selectedTemplate === template.id && (
                            <div className="absolute top-0.5 right-0.5 bg-[#22C55E] text-white text-[9px] px-1.5 py-0.5 rounded">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">Nepal-Specific Templates</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.filter(t => t.category === "nepali").map((template) => {
                      const TemplateComponent = template.component;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template.id);
                          }}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedTemplate === template.id
                              ? "border-[#22C55E] shadow-lg"
                              : "border-gray-200 hover:border-[#22C55E] hover:shadow-md"
                          }`}
                        >
                          <div className="w-full aspect-[7/4] bg-white overflow-hidden">
                            <div style={{ transform: 'scale(0.19)', transformOrigin: 'top left', width: '420px', height: '240px' }}>
                              <TemplateComponent data={cardData} />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-semibold px-1.5 py-0.5 bg-black/50 rounded">
                              {template.name}
                            </span>
                          </div>
                          {selectedTemplate === template.id && (
                            <div className="absolute top-0.5 right-0.5 bg-[#22C55E] text-white text-[9px] px-1.5 py-0.5 rounded">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex-1 h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg inline-flex items-center justify-center font-medium disabled:opacity-50" disabled={downloading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => exportAsImage("png")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportAsImage("jpeg")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download as JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 h-10"
                disabled={downloading}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-10"
                disabled={downloading}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Right Column - Preview with 3D Flip */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium mb-4">Preview (Click to flip)</label>
              <div 
                className="relative w-[420px] h-[240px] cursor-pointer"
                style={{ perspective: '1000px' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className="absolute w-full h-full transition-transform duration-700 shadow-xl rounded-lg"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front Side */}
                  <div 
                    ref={cardRef}
                    className="absolute w-full h-full rounded-lg overflow-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <SelectedTemplate data={cardData} />
                  </div>
                  
                  {/* Back Side (mirrored horizontally to appear correct when flipped) */}
                  <div 
                    className="absolute w-full h-full rounded-lg overflow-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg) scaleX(-1)' // Flip back and mirror horizontally
                    }}
                  >
                    <SelectedTemplate data={cardData} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click card to see flip animation</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
