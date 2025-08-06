import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./AdminAddDiscount.css";
import API_BASE_URL from "../../config";
import PopupMessage from "../../components/Popup/Popup";
import { ClipLoader } from 'react-spinners';

const AdminAddDiscount = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [discount, setDiscount] = useState('');
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      const adminId = sessionStorage.getItem("admin_id");
      if (!adminId) {
        navigate("/admin-login");
        return;
      }

      try {
        await fetchCategories(adminId);
      } catch (error) {
        setError("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCategories = async (adminId) => {


    try {
      const response = await fetch(`${API_BASE_URL}/view-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });

      const data = await response.json();
      if (response.ok) setCategories(data.categories || []);
      else
        displayPopup(data.error || "Failed to fetch categories.", "error");

    } catch {
      displayPopup("Server error while fetching categories.", "error");
    }
  };

  const fetchSubcategories = async (selectedCategoryId) => {
    const adminId = sessionStorage.getItem("admin_id");
    if (!adminId || !selectedCategoryId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/view-subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          category_id: selectedCategoryId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSubcategories(data.subcategories || []);
        setSelectedSubcategories([]);
      } else {
        setSubcategories([]);
        setSelectedSubcategories([]);
      }
    } catch {
      setSubcategories([]);
      setSelectedSubcategories([]);
    }
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    setSubcategories([]);
    fetchSubcategories(selectedId);
  };

  const handleSubcategoryCheckbox = (id) => {
    setSelectedSubcategories(prev =>
      prev.includes(id) ? prev.filter(subId => subId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const adminId = sessionStorage.getItem('admin_id');

    if (!categoryId || selectedSubcategories.length === 0 || !discount) {
      displayPopup('Please select category, at least one subcategory, and enter a discount.', "error");
      return;
    }

    if (isNaN(discount) || Number(discount) <= 0 || Number(discount) > 100) {
      displayPopup('Please enter a valid discount between 1 and 100. Do not use "%".', "error");
      return;
    }

    const selectedCategory = categories.find(cat => cat.category_id === categoryId);
    const payload = {
      admin_id: adminId,
      categories: selectedSubcategories.map(subId => {
        const sub = subcategories.find(sub => String(sub.id) === subId);
        return {
          category_id: categoryId,
          category_name: selectedCategory?.category_name,
          sub_category_id: subId,
          sub_category_name: sub?.sub_category_name,
          discount: discount
        };
      })
    };

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/apply-discount-subcategory`, payload);
      if (response.data.status_code === 200) {
        displayPopup('Discount applied successfully!', "success");
        setTimeout(() => navigate('/discounts'), 2000);
      } else {
        displayPopup(response.data.error || 'Failed to apply discount.', "error");
      }
    } catch {
      displayPopup('Server error while applying discount.', "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const allIds = subcategories.map(sub => String(sub.id));
      setSelectedSubcategories(allIds);
    } else {
      setSelectedSubcategories([]);
    }
  };
  const isAllSelected = subcategories.length > 0 && selectedSubcategories.length === subcategories.length;
  if (isLoading) {
    return (
      <div className="full-page-loading">
        <div className="loading-content">
          <ClipLoader size={50} color="#4450A2" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-discount-container">
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>

      <div className='add-discount-heading'>Add Discount</div>

      <div className="discount-form-group">
        <label className="discount-form-group-label">Category</label>
        <select
          className="discount-form-group-input"
          value={categoryId}
          onChange={handleCategoryChange}
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>
      {subcategories.length === 0 && categoryId && (
        <p className="no-subcategory-message">No subcategories available for the selected category.</p>
      )}
      {subcategories.length > 0 && (
        <div className="subcategory-table-container">
          <table className="subcategory-table">
            <thead>
              <tr>
                <th className="discount-table-group-label">S.No</th>
                <th className="discount-table-group-label">Subcategory Name</th>
                <th className="discount-table-group-label">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  /> Select All / Select
                </th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((sub, index) => (
                <tr key={sub.id}>
                  <td>{index + 1}</td>
                  <td>{sub.sub_category_name}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSubcategories.includes(String(sub.id))}
                      onChange={() => handleSubcategoryCheckbox(String(sub.id))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {categoryId && selectedSubcategories.length > 0 && (
        <div className="discount-form-group">
          <label className="discount-form-group-label">Discount</label>
          <input
            type="text"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="Enter Discount (example: 10)"
            className="discount-form-group-input"
          />
        </div>
      )}
      <div className="discount-button-group">
        <button className="cart-place-order" onClick={handleSave}>Save</button>
        <button className="cart-delete-selected discount-admin-side" onClick={() => navigate("/discounts")}>Cancel</button>
      </div>
    </div>
  );
};
export default AdminAddDiscount;
