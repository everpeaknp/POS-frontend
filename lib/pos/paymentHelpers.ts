export function getQRPaymentInfo(method: string, paymentSettings: any) {
  let qrImageUrl = "";
  let paymentInfo = "";
  let methodName = "";

  switch (method) {
    case "esewa":
      qrImageUrl = paymentSettings.esewa_qr || "";
      paymentInfo = paymentSettings.esewa_number || "Not configured";
      methodName = "eSewa";
      break;
    case "khalti":
      qrImageUrl = paymentSettings.khalti_qr || "";
      paymentInfo = paymentSettings.khalti_number || "Not configured";
      methodName = "Khalti";
      break;
    case "fonepay":
      qrImageUrl = paymentSettings.fonepay_qr || "";
      paymentInfo = paymentSettings.fonepay_number || "Not configured";
      methodName = "FonePay";
      break;
    case "bank_transfer":
      qrImageUrl = paymentSettings.bank_qr || "";
      if (paymentSettings.bank_name && paymentSettings.bank_account_number) {
        paymentInfo = `${paymentSettings.bank_name}|${paymentSettings.bank_account_number}|${paymentSettings.bank_account_name || ""}`;
      } else {
        paymentInfo = "Not configured";
      }
      methodName = "Bank Transfer";
      break;
    default:
      return null;
  }

  return { qrImageUrl, paymentInfo, methodName };
}
