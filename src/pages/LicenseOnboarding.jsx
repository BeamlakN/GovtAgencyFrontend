import { useState } from "react";
import { 
  Plus, 
  Upload, 
  FileText, 
  Download, 
  X, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import * as XLSX from 'xlsx';
import { onboardLicense, importLicenses } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

const LICENSE_CATEGORIES = [
  { value: "automobile", label: "Automobile" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "grade_1", label: "Grade 1 (Heavy Vehicle)" },
  { value: "grade_2", label: "Grade 2 (Medium Vehicle)" },
  { value: "public_transport", label: "Public Transport" },
  { value: "taxi", label: "Taxi" },
  { value: "truck", label: "Truck" },
  { value: "bus", label: "Bus" },
];

const initialFormState = {
  citizenFin: "",
  licenseNumber: "",
  categories: [],
  expiryDate: "",
  issueDate: "",
};

export default function LicenseOnboarding() {
  const [activeTab, setActiveTab] = useState("manual");
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    if (errors.categories) setErrors(prev => ({ ...prev, categories: "" }));
  };

  const validateDateDifference = (issueDate, expiryDate) => {
    if (!issueDate || !expiryDate) return true;
    const issue = new Date(issueDate);
    const expiry = new Date(expiryDate);
    let yearDiff = expiry.getFullYear() - issue.getFullYear();
    const monthDiff = expiry.getMonth() - issue.getMonth();
    const dayDiff = expiry.getDate() - issue.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) yearDiff--;
    return yearDiff === 5;
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    if (!formData.citizenFin) newErrors.citizenFin = "FIN is required";
    else if (!/^\d{12}$/.test(formData.citizenFin)) newErrors.citizenFin = "FIN must be exactly 12 digits";
    
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "License number is required";
    else if (formData.licenseNumber.trim().length < 3) newErrors.licenseNumber = "License number must be at least 3 characters";
    else if (/\s/.test(formData.licenseNumber)) newErrors.licenseNumber = "License number cannot contain spaces";
    
    if (formData.categories.length === 0) newErrors.categories = "At least one license category is required";
    
    if (formData.issueDate) {
      const issueDate = new Date(formData.issueDate);
      if (issueDate > new Date()) newErrors.issueDate = "Issue date cannot be in the future";
    }
    
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";
    else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) newErrors.expiryDate = "Expiry date must be in the future";
    }
    
    if (formData.issueDate && formData.expiryDate) {
      const issueDateObj = new Date(formData.issueDate);
      const expiryDateObj = new Date(formData.expiryDate);
      if (issueDateObj > expiryDateObj) {
        newErrors.issueDate = "Issue date must be before expiry date";
        newErrors.expiryDate = "Expiry date must be after issue date";
      } else if (!validateDateDifference(formData.issueDate, formData.expiryDate)) {
        newErrors.expiryDate = "Expiry date must be exactly 5 years from issue date";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiError = (err) => {
    const errorMessage = err?.response?.data?.error || err?.message || "Failed to onboard license";
    if (errorMessage.toLowerCase().includes("duplicate") || errorMessage.toLowerCase().includes("already exists")) {
      toastError("This license number already exists. Please use a unique license number.");
      setErrors(prev => ({ ...prev, licenseNumber: "License number already exists" }));
    } else if (errorMessage.toLowerCase().includes("fin already")) {
      toastError("This citizen already has a license. Each citizen can have only one license.");
      setErrors(prev => ({ ...prev, citizenFin: "Citizen already has a license" }));
    } else {
      toastError(errorMessage);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!validateAllFields()) return;
    setSubmitting(true);
    try {
      await onboardLicense({
        citizenFin: formData.citizenFin,
        licenseNumber: formData.licenseNumber.trim(),
        categories: formData.categories,
        expiryDate: formData.expiryDate,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
      });
      toastSuccess("License onboarded successfully!");
      setFormData(initialFormState);
      setErrors({});
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const validateExcelData = (row) => {
    const errors = [];
    if (!row.citizenFin) errors.push("FIN is required");
    else if (!/^\d{12}$/.test(row.citizenFin.toString())) errors.push("FIN must be exactly 12 digits");
    if (!row.licenseNumber) errors.push("License number is required");
    else if (row.licenseNumber.toString().length < 3) errors.push("License number must be at least 3 characters");
    if (!row.categories) errors.push("Categories are required");
    if (!row.expiryDate) errors.push("Expiry date is required");
    if (row.issueDate && row.expiryDate) {
      const issueDate = new Date(row.issueDate);
      const expiryDate = new Date(row.expiryDate);
      if (!isNaN(issueDate) && !isNaN(expiryDate)) {
        let yearDiff = expiryDate.getFullYear() - issueDate.getFullYear();
        const monthDiff = expiryDate.getMonth() - issueDate.getMonth();
        const dayDiff = expiryDate.getDate() - issueDate.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) yearDiff--;
        if (yearDiff !== 5) errors.push("Expiry date must be exactly 5 years from issue date");
      }
    }
    return errors;
  };

  const processExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toastError("No records found in the file");
          return;
        }
        
        const requiredColumns = ['citizenFin', 'licenseNumber', 'categories', 'expiryDate'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        if (missingColumns.length > 0) {
          toastError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }
        
        const processedData = [];
        jsonData.forEach((row, index) => {
          const categories = typeof row.categories === 'string' 
            ? row.categories.split(',').map(c => c.trim().toLowerCase())
            : [];
          const rowErrors = validateExcelData(row);
          processedData.push({
            ...row,
            categories: categories,
            isValid: rowErrors.length === 0,
            errors: rowErrors
          });
        });
        
        setPreviewData(processedData);
        setShowPreview(true);
      } catch (err) {
        toastError("Failed to parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processExcelFile(file);
    } else {
      toastError("Please upload an Excel or CSV file");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    processExcelFile(file);
  };

  const handleBulkSubmit = async () => {
    const validRecords = previewData.filter(record => record.isValid);
    if (validRecords.length === 0) {
      toastError("No valid records to import");
      return;
    }
    setUploading(true);
    try {
      const response = await importLicenses(validRecords);
      setImportResult(response);
      if (response.success === validRecords.length) {
        toastSuccess(`Successfully imported ${response.success} licenses!`);
        setPreviewData([]);
        setShowPreview(false);
      } else {
        toastError(`Imported ${response.success} of ${validRecords.length} records. ${response.failed} failed.`);
      }
    } catch (err) {
      toastError(err?.response?.data?.error || "Failed to import licenses");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [{
      citizenFin: "123456789012",
      licenseNumber: "DL-001",
      categories: "automobile,motorcycle",
      issueDate: "2023-01-01",
      expiryDate: "2028-01-01"
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "License Import Template");
    XLSX.writeFile(wb, "license_import_template.xlsx");
  };

  return (
    <div className="p-5 space-y-5">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => { setActiveTab("manual"); setShowPreview(false); setImportResult(null); setErrors({}); }}
            className={`pb-2.5 px-1 text-sm font-medium transition-colors ${activeTab === "manual" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Plus size={14} className="inline mr-1.5" />
            Manual
          </button>
          <button
            onClick={() => { setActiveTab("bulk"); setImportResult(null); setErrors({}); }}
            className={`pb-2.5 px-1 text-sm font-medium transition-colors ${activeTab === "bulk" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Upload size={14} className="inline mr-1.5" />
            Bulk Import
          </button>
        </nav>
      </div>

      {/* Manual Entry Form */}
      {activeTab === "manual" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-900">Add New License Record</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter license details to onboard a citizen's driver license</p>
          </div>
          
          <form onSubmit={handleManualSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Citizen FIN <span className="text-red-500">*</span></label>
                <input type="text" value={formData.citizenFin} onChange={(e) => handleFormChange("citizenFin", e.target.value.replace(/\D/g, '').slice(0, 12))} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.citizenFin ? "border-red-500" : "border-slate-200"}`} placeholder="12-digit ID" maxLength={12} />
                {errors.citizenFin && <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.citizenFin}</p>}
                <p className="mt-0.5 text-[9px] text-slate-400">Enter exactly 12 digits</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">License Number <span className="text-red-500">*</span></label>
                <input type="text" value={formData.licenseNumber} onChange={(e) => handleFormChange("licenseNumber", e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.licenseNumber ? "border-red-500" : "border-slate-200"}`} placeholder="DL-12345" />
                {errors.licenseNumber && <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.licenseNumber}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">License Categories <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-1.5">
                {LICENSE_CATEGORIES.map((cat) => (
                  <button key={cat.value} type="button" onClick={() => handleCategoryToggle(cat.value)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${formData.categories.includes(cat.value) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>{cat.label}</button>
                ))}
              </div>
              {errors.categories && <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.categories}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Issue Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.issueDate} onChange={(e) => handleFormChange("issueDate", e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.issueDate ? "border-red-500" : "border-slate-200"}`} />
                {errors.issueDate && <p className="mt-1 text-[10px] text-red-600"><AlertCircle size={10} />{errors.issueDate}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.expiryDate} onChange={(e) => handleFormChange("expiryDate", e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.expiryDate ? "border-red-500" : "border-slate-200"}`} />
                {errors.expiryDate && <p className="mt-1 text-[10px] text-red-600"><AlertCircle size={10} />{errors.expiryDate}</p>}
                <p className="mt-0.5 text-[9px] text-slate-400">Exactly 5 years from issue date</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                <Plus size={14} /> {submitting ? "Onboarding..." : "Onboard"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import */}
      {activeTab === "bulk" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText size={20} className="text-blue-600" /></div>
                <div><h3 className="font-semibold text-slate-900 text-sm">Download Template</h3><p className="text-xs text-slate-600">Get the Excel template</p></div>
              </div>
              <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"> <Download size={14} /> Template</button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">Upload License Data</h2>
              <p className="text-xs text-slate-500">Import from Excel or CSV file</p>
            </div>
            <div className="p-4">
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative rounded-xl border-2 border-dashed transition-all p-6 text-center cursor-pointer ${dragActive ? "border-slate-400 bg-slate-50" : "border-slate-300 bg-slate-50/50"}`}>
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Drag and drop or click to upload</p>
                <p className="text-[10px] text-slate-400 mt-1">.xlsx, .xls, .csv files</p>
              </div>
            </div>
          </div>
          
          {showPreview && previewData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div><h2 className="text-sm font-semibold text-slate-900">Preview</h2><p className="text-xs text-slate-500">{previewData.length} records {previewData.filter(r => !r.isValid).length > 0 && <span className="text-red-600 ml-1">({previewData.filter(r => !r.isValid).length} invalid)</span>}</p></div>
                <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="px-2 py-2">Status</th><th className="px-2 py-2">FIN</th><th className="px-2 py-2">License</th><th className="px-2 py-2">Categories</th><th className="px-2 py-2">Issue</th><th className="px-2 py-2">Expiry</th></tr></thead>
                  <tbody>
                    {previewData.slice(0, 8).map((record, idx) => (
                      <tr key={idx} className={`border-t ${!record.isValid ? 'bg-red-50' : ''}`}>
                        <td className="px-2 py-2">{record.isValid ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-red-500" />}</td>
                        <td className="px-2 py-2 font-mono text-xs">{record.citizenFin}</td>
                        <td className="px-2 py-2">{record.licenseNumber}</td>
                        <td className="px-2 py-2"><div className="flex flex-wrap gap-1">{record.categories?.map((c, i) => <span key={i} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">{c}</span>)}</div></td>
                        <td className="px-2 py-2">{record.issueDate || "N/A"}</td>
                        <td className="px-2 py-2">{record.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-end">
                <button onClick={handleBulkSubmit} disabled={uploading || previewData.filter(r => !r.isValid).length > 0} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                  <Upload size={14} /> Import {previewData.filter(r => r.isValid).length} Records
                </button>
              </div>
            </div>
          )}
          
          {importResult && (
            <div className={`rounded-xl border p-4 ${importResult.success === importResult.total ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex gap-2">
                {importResult.success === importResult.total ? <CheckCircle size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-amber-600" />}
                <div><p className="text-sm font-semibold">Import Summary</p><p className="text-xs">Total: {importResult.total} | Success: {importResult.success} | Failed: {importResult.failed}</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}