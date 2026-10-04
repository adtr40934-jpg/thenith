const fs = require('fs');
const path = require('path');

function modifyFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add api import if missing
  if (!content.includes('import api from')) {
    content = content.replace(
      'import toast from "react-hot-toast";',
      `import toast from "react-hot-toast";\nimport api from "../../api/index.js";`
    );
    // For PanelCheckout, the api path might be different, let's just make it relative
    if (filePath.includes('PanelCheckout')) {
      content = content.replace(
        'import toast from "react-hot-toast";',
        `import toast from "react-hot-toast";\nimport api from "../../../api/index.js";`
      );
    }
  }

  // 2. Add icons if missing
  if (filePath.includes('CheckoutPage.jsx') && !content.includes('Phone, ')) {
    content = content.replace('Truck } from "lucide-react";', 'Truck, Phone, Building2 } from "lucide-react";');
  }

  // 3. Add states for methods and wallet
  if (!content.includes('const [methods, setMethods]')) {
    content = content.replace(
      'const [paymentMethod, setPaymentMethod] = useState("online");',
      `const [paymentMethod, setPaymentMethod] = useState("online");
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [walletNumber, setWalletNumber] = useState("");

  useEffect(() => {
    let mounted = true;
    api.payment.getMethods().then(res => {
      if (mounted && res.methods) {
        setMethods(res.methods);
        if (res.methods.length > 0) setSelectedMethod(res.methods[0]);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const isWalletMethod = (m) => m?.payment_method_id === 4 || m?.name_en?.toLowerCase().includes("wallet");
  const isWalletValid = /^01[0125][0-9]{8}$/.test(walletNumber);
`
    );
  }

  // 4. Update the handleCheckout to createOrderIntent if online
  if (content.includes('navigate(`/payment?${params.toString()}`);')) {
    content = content.replace(
      /navigate\(\`\/payment\?\$\{params\.toString\(\)\}\`\);/g,
      `
            if (selectedMethod) {
              try {
                const intentResult = await api.client.post(\`/payment/order/\${result.orderId}\`, {
                  methodId: selectedMethod.payment_method_id,
                  walletNumber: walletNumber || null,
                });
                const txData = intentResult.data;
                const redirectUrl = txData.checkoutUrl || txData.paymentData?.redirectTo;
                if (redirectUrl) {
                  window.location.href = redirectUrl;
                  return;
                }
              } catch(err) {
                 toast.error(getLocalizedErrorMessage(err, isArabic ? "ar" : "en"));
                 return;
              }
            }
            navigate(\`/payment?type=order&orderId=\${result.orderId}\`);
`
    );
  }

  // 5. Update UI to show methods when paymentMethod is online
  const methodsUI = `
                {paymentMethod === "online" && methods.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 p-4 bg-white rounded-xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">
                      {isArabic ? "OOOO1 OO1USU,O O U,O_U?O1" : "Select Payment Gateway"}
                    </p>
                    {methods.map(m => (
                      <label key={m.payment_method_id} className={\`cursor-pointer p-3 border rounded-lg flex flex-col \${selectedMethod?.payment_method_id === m.payment_method_id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'}\`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="fawaterak_method" checked={selectedMethod?.payment_method_id === m.payment_method_id} onChange={() => setSelectedMethod(m)} className="h-4 w-4 accent-indigo-600" />
                          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border shadow-sm">
                            <img src={m.logo} alt={isArabic ? m.name_ar : m.name_en} className="max-w-[24px] max-h-[24px] object-contain" />
                          </div>
                          <span className="font-semibold text-sm">{isArabic ? m.name_ar : m.name_en}</span>
                        </div>
                        {selectedMethod?.payment_method_id === m.payment_method_id && isWalletMethod(m) && (
                          <div className="mt-3 ml-7">
                             <input type="tel" value={walletNumber} onChange={e => setWalletNumber(e.target.value.replace(/\\D/g, '').slice(0,11))} placeholder="01XXXXXXXXX" className={\`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 \${walletNumber.length === 11 ? (isWalletValid ? 'border-emerald-500 ring-emerald-100' : 'border-rose-500 ring-rose-100') : 'border-slate-200 focus:border-indigo-500 ring-indigo-100'}\`} />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
`;
  
  if (content.includes('{t("store.onlinePaymentRequired")}')) {
    content = content.replace(
      '</span>\n              </label>',
      `</span>\n              ${methodsUI}\n              </label>`
    );
  }

  // Handle panel checkout UI similarly
  if (content.includes('text-slate-500">{isArabic ? "O3USOU. OU^OUSU,U, O U,OU,O" OU+O_ O U,OOU.O1" : "You will be redirected to complete payment."}</span>')) {
    content = content.replace(
      'text-slate-500">{isArabic ? "O3USOU. OU^OUSU,U, O U,OU,O" OU+O_ O U,OOU.O1" : "You will be redirected to complete payment."}</span>',
      `text-slate-500">{isArabic ? "O3USOU. OU^OUSU,U, O U,OU,O" OU+O_ O U,OOU.O1" : "You will be redirected to complete payment."}</span>\n${methodsUI}`
    );
  }

  // Update button validation
  const btnReplacement = `disabled={loading || (paymentMethod === "online" && (!selectedMethod || (isWalletMethod(selectedMethod) && !isWalletValid)))}`;
  content = content.replace(/disabled=\{loading\}/g, btnReplacement);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Modified', filePath);
}

modifyFile(path.join(__dirname, 'src/pages/store/CheckoutPage.jsx'));
modifyFile(path.join(__dirname, 'src/panel/components/dashboard/PanelCheckout.jsx'));
