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
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: "" }));
    }
  };

  // Calculate date difference in years
  const getYearDifference = (date1, date2) => {
    const start = new Date(date1);
    const end = new Date(date2);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffYears = diffDays / 365.25;
    return diffYears;
  };

  // Validate that expiry date is exactly 5 years from issue date
  const validateDateDifference = (issueDate, expiryDate) => {
    if (!issueDate || !expiryDate) return true;
    
    const issue = new Date(issueDate);
    const expiry = new Date(expiryDate);
    
    // Calculate the difference in years
    let yearDiff = expiry.getFullYear() - issue.getFullYear();
    const monthDiff = expiry.getMonth() - issue.getMonth();
    const dayDiff = expiry.getDate() - issue.getDate();
    
    // Adjust year difference if the expiry date hasn't reached the anniversary yet
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      yearDiff--;
    }
    
    return yearDiff === 5;
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    // Validate FIN
    if (!formData.citizenFin) {
      newErrors.citizenFin = "FIN is required";
    } else if (!/^\d{12}$/.test(formData.citizenFin)) {
      newErrors.citizenFin = "FIN must be exactly 12 digits";
    }
    
    // Validate License Number
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    } else if (formData.licenseNumber.trim().length < 3) {
      newErrors.licenseNumber = "License number must be at least 3 characters";
    } else if (formData.licenseNumber.trim().length > 50) {
      newErrors.licenseNumber = "License number must not exceed 50 characters";
    } else if (/\s/.test(formData.licenseNumber)) {
      newErrors.licenseNumber = "License number cannot contain spaces";
    }
    
    // Validate Categories
    if (formData.categories.length === 0) {
      newErrors.categories = "At least one license category is required";
    }
    
    // Validate Issue Date (if provided)
    if (formData.issueDate) {
      const issueDate = new Date(formData.issueDate);
      const today = new Date();
      if (issueDate > today) {
        newErrors.issueDate = "Issue date cannot be in the future";
      }
    }
    
    // Validate Expiry Date
    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        newErrors.expiryDate = "Expiry date must be in the future";
      }
    }
    
    // Validate that issue date and expiry date are exactly 5 years apart
    if (formData.issueDate && formData.expiryDate) {
      const issueDateObj = new Date(formData.issueDate);
      const expiryDateObj = new Date(formData.expiryDate);
      
      if (issueDateObj > expiryDateObj) {
        newErrors.issueDate = "Issue date must be before expiry date";
        newErrors.expiryDate = "Expiry date must be after issue date";
      } else if (!validateDateDifference(formData.issueDate, formData.expiryDate)) {
        newErrors.expiryDate = "License expiry date must be exactly 5 years from the issue date";
        newErrors.issueDate = "License issue and expiry dates must be exactly 5 years apart";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to handle API errors
  const handleApiError = (err) => {
    const errorMessage = err?.response?.data?.error || err?.message || "Failed to onboard license";
    
    // Check for duplicate license number error
    if (errorMessage.toLowerCase().includes("duplicate") || 
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.includes("license number already")) {
      toastError("This license number already exists in the system. Please use a unique license number.");
      setErrors(prev => ({ ...prev, licenseNumber: "License number already exists" }));
      return;
    }
    
    // Check for duplicate FIN error
    if (errorMessage.toLowerCase().includes("fin already") || 
        errorMessage.toLowerCase().includes("citizen already has a license")) {
      toastError("This citizen already has a license registered. Each citizen can have only one license.");
      setErrors(prev => ({ ...prev, citizenFin: "Citizen already has a license" }));
      return;
    }
    
    // Generic error
    toastError(errorMessage);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await onboardLicense({
        citizenFin: formData.citizenFin,
        licenseNumber: formData.licenseNumber.trim(),
        categories: formData.categories,
        expiryDate: formData.expiryDate,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
      });
      
      toastSuccess("License onboarded successfully!");
      setFormData(initialFormState);
      setErrors({});
      console.log("Response:", response);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    processExcelFile(file);
  };

  const validateExcelData = (row, index) => {
    const errors = [];
    
    if (!row.citizenFin) {
      errors.push("FIN is required");
    } else if (!/^\d{12}$/.test(row.citizenFin.toString())) {
      errors.push("FIN must be exactly 12 digits");
    }
    
    if (!row.licenseNumber) {
      errors.push("License number is required");
    } else if (row.licenseNumber.toString().length < 3) {
      errors.push("License number must be at least 3 characters");
    }
    
    if (!row.categories) {
      errors.push("Categories are required");
    }
    
    if (!row.expiryDate) {
      errors.push("Expiry date is required");
    }
    
    // Validate date difference for Excel rows
    if (row.issueDate && row.expiryDate) {
      const issueDate = new Date(row.issueDate);
      const expiryDate = new Date(row.expiryDate);
      
      if (!isNaN(issueDate) && !isNaN(expiryDate)) {
        let yearDiff = expiryDate.getFullYear() - issueDate.getFullYear();
        const monthDiff = expiryDate.getMonth() - issueDate.getMonth();
        const dayDiff = expiryDate.getDate() - issueDate.getDate();
        
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          yearDiff--;
        }
        
        if (yearDiff !== 5) {
          errors.push("Expiry date must be exactly 5 years from issue date");
        }
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
        
        // Validate required columns
        const requiredColumns = ['citizenFin', 'licenseNumber', 'categories', 'expiryDate'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          toastError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }
        
        // Process and validate each row
        const processedData = [];
        const validationErrors = [];
        
        jsonData.forEach((row, index) => {
          const categories = typeof row.categories === 'string' 
            ? row.categories.split(',').map(c => c.trim().toLowerCase())
            : [];
          
          const rowErrors = validateExcelData(row, index);
          
          if (rowErrors.length > 0) {
            validationErrors.push({ row: index + 2, errors: rowErrors });
          }
          
          processedData.push({
            ...row,
            categories: categories,
            isValid: rowErrors.length === 0,
            errors: rowErrors
          });
        });
        
        if (validationErrors.length > 0) {
          toastError(`Found ${validationErrors.length} rows with validation errors. Please fix and re-upload.`);
          console.error("Validation errors:", validationErrors);
        }
        
        setPreviewData(processedData);
        setShowPreview(true);
      } catch (err) {
        console.error("Error parsing file:", err);
        toastError("Failed to parse Excel file");
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
      
      // Handle duplicate errors in bulk import
      if (response.duplicates && response.duplicates.length > 0) {
        toastError(`${response.duplicates.length} duplicate records were skipped. ${response.success} records imported successfully.`);
      } else if (response.success === validRecords.length) {
        toastSuccess(`Successfully imported ${response.success} licenses!`);
        setPreviewData([]);
        setShowPreview(false);
      } else if (response.failed > 0) {
        toastError(`Imported ${response.success} of ${validRecords.length} records. ${response.failed} failed due to duplicates or validation errors.`);
      } else {
        toastSuccess(`Successfully imported ${response.success} licenses!`);
        setPreviewData([]);
        setShowPreview(false);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to import licenses";
      
      // Check for duplicate errors in bulk import
      if (errorMessage.toLowerCase().includes("duplicate") || 
          errorMessage.toLowerCase().includes("already exists")) {
        toastError("Some records have duplicate license numbers. Please check your data and remove duplicates.");
      } else {
        toastError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        citizenFin: "123456789012",
        licenseNumber: "DL-001",
        categories: "automobile,motorcycle",
        issueDate: "2023-01-01",
        expiryDate: "2028-01-01"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "License Import Template");
    XLSX.writeFile(wb, "license_import_template.xlsx");
  };

  return (
    <div className="p-8 space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          <button
            onClick={() => {
              setActiveTab("manual");
              setShowPreview(false);
              setImportResult(null);
              setErrors({});
            }}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === "manual"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Plus size={16} className="inline mr-2" />
            Manual Entry
          </button>
          <button
            onClick={() => {
              setActiveTab("bulk");
              setImportResult(null);
              setErrors({});
            }}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === "bulk"
                ? "text-slate-900 border-b-2 border-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            Bulk Import
          </button>
        </nav>
      </div>

      {/* Manual Entry Form */}
      {activeTab === "manual" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Add New License Record</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enter license details to onboard a citizen's driver license</p>
          </div>
          
          <form onSubmit={handleManualSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Citizen FIN */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Citizen FIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.citizenFin}
                  onChange={(e) => handleFormChange("citizenFin", e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.citizenFin
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-slate-100 focus:border-slate-400"
                  }`}
                  placeholder="12-digit national ID"
                  maxLength={12}
                />
                {errors.citizenFin && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.citizenFin}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">Enter exactly 12 digits</p>
              </div>
              
              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFormChange("licenseNumber", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                    errors.licenseNumber
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-slate-100 focus:border-slate-400"
                  }`}
                  placeholder="DL-12345"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.licenseNumber}
                  </p>
                )}
              </div>
            </div>
            
            {/* License Categories */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                License Categories <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LICENSE_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.categories.includes(category.value)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.categories}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">Select all applicable categories</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleFormChange("issueDate", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                    errors.issueDate
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-slate-100 focus:border-slate-400"
                  }`}
                />
                {errors.issueDate && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.issueDate}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">First issue date of the license</p>
              </div>
              
              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleFormChange("expiryDate", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                    errors.expiryDate
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-slate-100 focus:border-slate-400"
                  }`}
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.expiryDate}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">Must be exactly 5 years from the issue date</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {submitting ? "Onboarding..." : "Onboard License"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import */}
      {activeTab === "bulk" && (
        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Download Template</h3>
                  <p className="text-sm text-slate-600">Get the Excel template with correct column headers</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download Template
              </button>
            </div>
          </div>
          
          {/* File Upload Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Upload License Data</h2>
              <p className="text-sm text-slate-500 mt-0.5">Import multiple license records from Excel or CSV file</p>
            </div>
            
            <div className="p-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all ${
                  dragActive
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Upload size={48} className="text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-700">Drag and drop or click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv files</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Section with Validation */}
          {showPreview && previewData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Preview Import Data</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {previewData.length} records found
                    {previewData.filter(r => !r.isValid).length > 0 && (
                      <span className="text-red-600 ml-2">
                        ({previewData.filter(r => !r.isValid).length} invalid)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">FIN</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">License #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Categories</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Issue Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 10).map((record, index) => (
                      <tr key={index} className={`hover:bg-slate-50 ${!record.isValid ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          {record.isValid ? (
                            <CheckCircle size={16} className="text-emerald-500" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{record.citizenFin}</td>
                        <td className="px-4 py-3 text-sm">{record.licenseNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(record.categories) ? record.categories : []).map((cat, i) => (
                              <span key={i} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{record.issueDate || "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{record.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {previewData.length > 10 && (
                <div className="p-4 bg-slate-50 text-center text-sm text-slate-500">
                  Showing 10 of {previewData.length} records
                </div>
              )}
              
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={handleBulkSubmit}
                  disabled={uploading || previewData.filter(r => !r.isValid).length > 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} />
                  {uploading ? "Importing..." : `Import ${previewData.filter(r => r.isValid).length} Valid Records`}
                </button>
              </div>
            </div>
          )}
          
          {/* Import Result */}
          {importResult && (
            <div className={`rounded-2xl border p-5 ${
              importResult.success === importResult.total
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                {importResult.success === importResult.total ? (
                  <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    importResult.success === importResult.total ? "text-emerald-800" : "text-amber-800"
                  }`}>
                    Import Summary
                  </h3>
                  <p className="text-sm mt-1">
                    Total: {importResult.total} | 
                    Success: <span className="text-emerald-600 font-medium">{importResult.success}</span> | 
                    Failed: <span className="text-red-600 font-medium">{importResult.failed}</span>
                  </p>
                  {importResult.duplicates && importResult.duplicates.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-amber-800">Duplicates Skipped:</p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {importResult.duplicates.slice(0, 5).map((dup, i) => (
                          <li key={i}>{dup.licenseNumber || dup.citizenFin}: Already exists in system</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-amber-800">Failed Records:</p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}