import React, { useState, useEffect } from 'react';
import { 
  Pill, Plus, Search, PackagePlus, MinusCircle, History, 
  Syringe, Stethoscope, AlertOctagon, FileText, 
  MapPin, Tag, Boxes, DollarSign, ClipboardList, X
} from 'lucide-react';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  // --- FORM STATES ---
  const [showBatchModal, setShowBatchModal] = useState(null);
  const [showDispenseModal, setShowDispenseModal] = useState(null);
  const [showPreviewItem, setShowPreviewItem] = useState(null);
  
  // Master Item Form
  const [newItem, setNewItem] = useState({
    name: '', sku: '', genericName: '', brand: '', category: 'Tablet',
    subCategory: '', form: '', strength: '', unit: '', packSize: '',
    hsnCode: '', barcode: '', rackLocation: '',
    minStock: 10, maxStock: 1000, reorderLevel: 20,
    isControlled: false, batchRequired: true,
    gstPercentage: 0, mrp: 0, purchaseRate: 0, sellingRate: 0
  });

  // Batch Form
  const [newBatch, setNewBatch] = useState({
    batchNumber: '', manufacturer: '', expiryDate: '', mfgDate: '',
    quantity: 0, unitCost: 0, mrp: 0,
    poNumber: '', grnNumber: '', supplier: ''
  });

  const [dispenseQty, setDispenseQty] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      const response = await fetch('http://localhost:5000/api/pharmacy', {
        headers: { Authorization: `Bearer ${userInfo.token || ''}` }
      });
      const data = await response.json();
      setMedicines(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inventory', error);
      setMedicines([]);
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      const response = await fetch('http://localhost:5000/api/pharmacy/add-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token || ''}` },
        body: JSON.stringify(newItem)
      });
      
      if (response.ok) {
        alert("Item Created Successfully");
        fetchInventory();
        setActiveTab('inventory');
        setNewItem({
          name: '', sku: '', genericName: '', brand: '', category: 'Tablet',
          subCategory: '', form: '', strength: '', unit: '', packSize: '',
          hsnCode: '', barcode: '', rackLocation: '',
          minStock: 10, maxStock: 1000, reorderLevel: 20,
          isControlled: false, batchRequired: true,
          gstPercentage: 0, mrp: 0, purchaseRate: 0, sellingRate: 0
        });
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create item');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      const payload = { ...newBatch, medicineId: showBatchModal?._id };
      const response = await fetch('http://localhost:5000/api/pharmacy/add-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token || ''}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Stock Added Successfully");
        setShowBatchModal(null);
        setNewBatch({ batchNumber: '', manufacturer: '', expiryDate: '', mfgDate: '', quantity: 0, unitCost: 0, mrp: 0, poNumber: '', grnNumber: '', supplier: '' });
        fetchInventory();
      } else {
        alert('Error adding batch');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding batch');
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      const response = await fetch('http://localhost:5000/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token || ''}` },
        body: JSON.stringify({ medicineId: showDispenseModal?._id, quantity: dispenseQty })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Success! Remaining Stock: ${data.currentStock}`);
        setShowDispenseModal(null);
        setDispenseQty(1);
        fetchInventory();
      } else {
        alert(data.message || 'Dispense failed');
      }
    } catch (err) {
      console.error(err);
      alert('Dispense Failed');
    }
  };

  const filteredMedicines = medicines.filter(m =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.genericName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium text-lg">Loading Pharmacy Database...</div>;

  // --- REUSABLE UI COMPONENTS ---
  // Improved Field component with better spacing
  const Field = ({ label, children, required = false }) => (
    <div className="flex flex-col">
      <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  // Common input styling: Light gray background + visible border
  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 placeholder-gray-400 shadow-sm";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 md:px-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Pill className="mr-3 text-primary h-8 w-8" />
            <span>Hospital Pharmacy</span>
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Pharmacy Master — Items, Batches & Dispense</p>
        </div>

        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${activeTab==='inventory' ? 'bg-primary text-white ring-2 ring-primary ring-offset-1' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
          >
            <ClipboardList className="inline mr-2 w-4 h-4"/> Inventory
          </button>
          <button 
            onClick={() => setActiveTab('add-item')} 
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${activeTab==='add-item' ? 'bg-primary text-white ring-2 ring-primary ring-offset-1' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
          >
            <Plus className="inline mr-2 w-4 h-4"/> Add Item
          </button>
        </div>
      </div>

      {/* --- INVENTORY LIST VIEW --- */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="w-full md:max-w-xl relative">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input 
                value={searchTerm} 
                onChange={e=>setSearchTerm(e.target.value)} 
                placeholder="Search Item Name, Generic Name or SKU..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm" 
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Legend:</div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full" /> <div className="text-xs font-medium text-gray-700">Low Stock</div>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" /> <div className="text-xs font-medium text-gray-700">Narcotic</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-5">Item Description</th>
                  <th className="p-5">Details</th>
                  <th className="p-5">Location</th>
                  <th className="p-5 text-center">Stock Level</th>
                  <th className="p-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMedicines.map(med => (
                  <tr key={med._id} className={`group hover:bg-blue-50/50 transition duration-150 ${med.totalQuantity <= med.minStock ? 'bg-red-50/40' : ''}`}>
                    <td className="p-5 align-top">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-gray-100 text-primary group-hover:bg-white group-hover:shadow-md transition-all">
                          {med.category === 'Injection' ? <Syringe size={20}/> : <Pill size={20}/>}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                            {med.name}
                            {med.isControlled && <AlertOctagon className="text-purple-600 w-4 h-4" title="Controlled Substance" />}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-medium">{med.genericName}</div>
                          {med.sku && <span className="inline-block mt-1.5 px-2 py-0.5 roundedbg-gray-100 text-gray-600 text-xs font-mono bg-gray-200">SKU: {med.sku}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="p-5 align-top">
                      <div className="text-sm font-semibold text-gray-700">{med.category} {med.subCategory ? `• ${med.subCategory}` : ''}</div>
                      <div className="text-xs text-gray-500 mt-1">{med.strength} {med.unit} • {med.packSize}</div>
                      <div className="text-xs text-gray-400 mt-1.5 italic">{med.manufacturer || 'Unknown Mfg'}</div>
                    </td>

                    <td className="p-5 align-top">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                        <MapPin size={14} className="text-gray-400"/> <span>{med.rackLocation || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="p-5 text-center align-top">
                      <div className={`text-xl font-bold font-mono ${med.totalQuantity <= med.minStock ? 'text-red-600' : 'text-green-700'}`}>{med.totalQuantity ?? 0}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Units</div>
                    </td>

                    <td className="p-5 text-right align-top space-x-2">
                      <button onClick={()=>{ setShowBatchModal(med); setNewBatch(prev=>({ ...prev, quantity:0 })); }} className="px-3 py-2 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-white transition shadow-sm inline-flex items-center">
                        <PackagePlus className="w-3.5 h-3.5 mr-1.5"/> Stock
                      </button>
                      <button onClick={()=>{ setShowDispenseModal(med); setDispenseQty(1); }} className="px-3 py-2 rounded-lg border border-red-500 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition shadow-sm inline-flex items-center">
                        <MinusCircle className="w-3.5 h-3.5 mr-1.5"/> Dispense
                      </button>
                      <button onClick={()=>setShowPreviewItem(med)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition">View</button>
                    </td>
                  </tr>
                ))}

                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500 font-medium">No items found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT ITEM TAB (Redesigned) --- */}
      {activeTab === 'add-item' && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-primary/10 p-2 rounded-lg mr-3">
                  <FileText className="text-primary h-6 w-6"/> 
                </div>
                Create New Item Master
              </h2>
              <p className="text-sm text-gray-500 mt-1 ml-11">Define the properties for a new pharmaceutical item (Matches Items.csv)</p>
            </div>
            
            <form onSubmit={handleCreateItem} className="p-8 space-y-10">

              {/* Section 1: Basic Info */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-700"><Tag size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Field label="Item Name" required>
                      <input required className={inputClass} placeholder="e.g. Paracetamol 500mg" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})} />
                    </Field>
                  </div>
                  <div>
                    <Field label="Generic Name">
                      <input className={inputClass} placeholder="e.g. Acetaminophen" value={newItem.genericName} onChange={e=>setNewItem({...newItem, genericName:e.target.value})} />
                    </Field>
                  </div>
                  <div>
                    <Field label="Brand / Manufacturer">
                      <input className={inputClass} placeholder="e.g. GSK" value={newItem.brand} onChange={e=>setNewItem({...newItem, brand:e.target.value})} />
                    </Field>
                  </div>
                  
                  {/* Row 2 */}
                  <div>
                    <Field label="Category" required>
                      <select className={inputClass} value={newItem.category} onChange={e=>setNewItem({...newItem, category:e.target.value})}>
                        {['Tablet','Syrup','Injection','Ointment','Consumable','Surgical','IV Fluid','Other'].map(c=> <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div>
                    <Field label="Sub-Category">
                      <input className={inputClass} placeholder="e.g. Antibiotic" value={newItem.subCategory} onChange={e=>setNewItem({...newItem, subCategory:e.target.value})} />
                    </Field>
                  </div>
                  <div>
                    <Field label="SKU / Unique Code">
                      <input className={inputClass} placeholder="Scan or Type SKU" value={newItem.sku} onChange={e=>setNewItem({...newItem, sku:e.target.value})} />
                    </Field>
                  </div>
                </div>
              </section>

              {/* Section 2: Specs */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3 text-purple-700"><FileText size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">Physical Specifications</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Field label="Form">
                    <input className={inputClass} placeholder="e.g. Capsule" value={newItem.form} onChange={e=>setNewItem({...newItem, form:e.target.value})} />
                  </Field>
                  <Field label="Strength">
                    <input className={inputClass} placeholder="e.g. 500mg" value={newItem.strength} onChange={e=>setNewItem({...newItem, strength:e.target.value})} />
                  </Field>
                  <Field label="Unit Measure">
                    <input className={inputClass} placeholder="e.g. Strip, Vial" value={newItem.unit} onChange={e=>setNewItem({...newItem, unit:e.target.value})} />
                  </Field>
                  <Field label="Pack Size">
                    <input className={inputClass} placeholder="e.g. 1x10" value={newItem.packSize} onChange={e=>setNewItem({...newItem, packSize:e.target.value})} />
                  </Field>
                </div>
              </section>

              {/* Section 3: Inventory Rules */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                  <div className="bg-orange-100 p-2 rounded-lg mr-3 text-orange-700"><Boxes size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">Inventory Control</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Rack / Shelf Location">
                    <input className={inputClass} placeholder="e.g. A-12" value={newItem.rackLocation} onChange={e=>setNewItem({...newItem, rackLocation:e.target.value})} />
                  </Field>
                  <Field label="Min Stock Alert">
                    <input type="number" className={inputClass} value={newItem.minStock} onChange={e=>setNewItem({...newItem, minStock: Number(e.target.value)})} />
                  </Field>
                  <Field label="Reorder Level">
                    <input type="number" className={inputClass} value={newItem.reorderLevel} onChange={e=>setNewItem({...newItem, reorderLevel: Number(e.target.value)})} />
                  </Field>
                  
                  <div className="md:col-span-3 mt-2">
                    <label className="flex items-center p-4 border border-red-200 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition shadow-sm w-full md:w-auto">
                      <input type="checkbox" className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500" checked={newItem.isControlled} onChange={e=>setNewItem({...newItem, isControlled: e.target.checked})} />
                      <span className="ml-3 text-sm font-bold text-red-800 flex items-center">
                        <AlertOctagon size={18} className="mr-2"/> Is Controlled Substance? (Narcotic)
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Section 4: Financials */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                  <div className="bg-green-100 p-2 rounded-lg mr-3 text-green-700"><DollarSign size={20} /></div>
                  <h3 className="text-lg font-bold text-gray-800">Financials</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Field label="HSN Code">
                    <input className={inputClass} placeholder="Tax Code" value={newItem.hsnCode} onChange={e=>setNewItem({...newItem, hsnCode:e.target.value})} />
                  </Field>
                  <Field label="GST %">
                    <div className="relative">
                      <input type="number" className={inputClass} value={newItem.gstPercentage} onChange={e=>setNewItem({...newItem, gstPercentage: Number(e.target.value)})} />
                      <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-bold">%</span>
                    </div>
                  </Field>
                  <Field label="Base MRP">
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 text-sm font-bold">₹</span>
                      <input type="number" className={`${inputClass} pl-8`} value={newItem.mrp} onChange={e=>setNewItem({...newItem, mrp: Number(e.target.value)})} />
                    </div>
                  </Field>
                  <Field label="Selling Rate">
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 text-sm font-bold">₹</span>
                      <input type="number" className={`${inputClass} pl-8`} value={newItem.sellingRate} onChange={e=>setNewItem({...newItem, sellingRate: Number(e.target.value)})} />
                    </div>
                  </Field>
                </div>
              </section>

              <div className="pt-8 flex justify-end">
                <button type="submit" className="bg-primary text-white py-4 px-10 rounded-xl font-bold hover:bg-green-800 shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center text-lg">
                  <Plus size={22} className="mr-2"/> Save Item Master
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD BATCH --- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b bg-primary text-white">
              <div className="flex items-center gap-3">
                <PackagePlus size={24} />
                <div>
                  <div className="font-bold text-lg">Add Batch Stock</div>
                  <div className="text-xs opacity-80">{showBatchModal.name}</div>
                </div>
              </div>
              <button onClick={()=>setShowBatchModal(null)} className="p-2 rounded-full hover:bg-white/20 transition"><X /></button>
            </div>

            <form onSubmit={handleAddBatch} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Batch Number" required>
                  <input required className={inputClass} value={newBatch.batchNumber} onChange={e=>setNewBatch({...newBatch, batchNumber:e.target.value})} />
                </Field>
                <Field label="Manufacturer">
                  <input className={inputClass} value={newBatch.manufacturer} onChange={e=>setNewBatch({...newBatch, manufacturer:e.target.value})} />
                </Field>
                <Field label="Quantity" required>
                  <input type="number" required className={inputClass} value={newBatch.quantity} onChange={e=>setNewBatch({...newBatch, quantity: Number(e.target.value)})} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Field label="Mfg Date">
                  <input type="date" className={inputClass} value={newBatch.mfgDate} onChange={e=>setNewBatch({...newBatch, mfgDate:e.target.value})} />
                </Field>
                <Field label="Expiry Date" required>
                  <input type="date" required className={inputClass} value={newBatch.expiryDate} onChange={e=>setNewBatch({...newBatch, expiryDate:e.target.value})} />
                </Field>
                <Field label="Unit Cost">
                  <input type="number" className={inputClass} value={newBatch.unitCost} onChange={e=>setNewBatch({...newBatch, unitCost: Number(e.target.value)})} />
                </Field>
                <Field label="MRP">
                  <input type="number" className={inputClass} value={newBatch.mrp} onChange={e=>setNewBatch({...newBatch, mrp: Number(e.target.value)})} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="PO Number">
                  <input className={inputClass} value={newBatch.poNumber} onChange={e=>setNewBatch({...newBatch, poNumber:e.target.value})} />
                </Field>
                <Field label="GRN Number">
                  <input className={inputClass} value={newBatch.grnNumber} onChange={e=>setNewBatch({...newBatch, grnNumber:e.target.value})} />
                </Field>
                <Field label="Supplier">
                  <input className={inputClass} value={newBatch.supplier} onChange={e=>setNewBatch({...newBatch, supplier:e.target.value})} />
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={()=>setShowBatchModal(null)} className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-green-800 transition shadow-lg">Confirm Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DISPENSE --- */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-600 text-white">
              <div className="flex items-center gap-3"><MinusCircle /> <div className="font-bold text-lg">Dispense Item</div></div>
              <button onClick={()=>setShowDispenseModal(null)} className="p-2 rounded-full hover:bg-white/20 transition"><X /></button>
            </div>

            <form onSubmit={handleDispense} className="p-8 space-y-6">
              <div className="text-center bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="font-bold text-xl text-gray-900">{showDispenseModal.name}</div>
                <div className="text-sm text-gray-500 mt-1">Current Stock: <span className="font-mono font-bold text-gray-800">{showDispenseModal.totalQuantity ?? 0}</span></div>
              </div>

              <Field label="Quantity to Dispense" required>
                <input type="number" min={1} max={showDispenseModal.totalQuantity ?? 1} value={dispenseQty} onChange={e=>setDispenseQty(Number(e.target.value))} required className={`${inputClass} text-center text-3xl font-bold h-16`} />
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowDispenseModal(null)} className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg transition">Dispense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW PANEL --- */}
      {showPreviewItem && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/30 pointer-events-auto backdrop-blur-sm" onClick={()=>setShowPreviewItem(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto pointer-events-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div className="font-bold text-lg flex items-center gap-2"><FileText className="text-primary"/> Item Details</div>
              <button onClick={()=>setShowPreviewItem(null)} className="p-2 rounded hover:bg-gray-200"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{showPreviewItem.name}</h3>
                <p className="text-gray-500">{showPreviewItem.genericName}</p>
                <div className="flex gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">SKU: {showPreviewItem.sku || 'N/A'}</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">{showPreviewItem.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Stock</div>
                  <div className="text-2xl font-mono font-bold text-gray-800">{showPreviewItem.totalQuantity}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Location</div>
                  <div className="text-lg font-medium text-gray-800">{showPreviewItem.rackLocation || '-'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Specs</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">Brand:</div> <div>{showPreviewItem.brand}</div>
                  <div className="text-gray-500">Strength:</div> <div>{showPreviewItem.strength}</div>
                  <div className="text-gray-500">Unit:</div> <div>{showPreviewItem.unit}</div>
                  <div className="text-gray-500">Pack Size:</div> <div>{showPreviewItem.packSize}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">Financials</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">MRP:</div> <div className="font-mono">₹{showPreviewItem.mrp}</div>
                  <div className="text-gray-500">Selling Rate:</div> <div className="font-mono">₹{showPreviewItem.sellingRate}</div>
                  <div className="text-gray-500">GST:</div> <div>{showPreviewItem.gstPercentage}%</div>
                  <div className="text-gray-500">HSN:</div> <div>{showPreviewItem.hsnCode}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pharmacy;