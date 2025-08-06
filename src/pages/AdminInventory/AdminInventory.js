import { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminInventory.css';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config";
import PopupMessage from "../../components/Popup/Popup";
import { ClipLoader } from 'react-spinners';

const AdminInventoryProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const adminId = sessionStorage.getItem("admin_id");
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 10000);
  };
  useEffect(() => {
    fetchInventoryProducts();
  }, []);

  const fetchInventoryProducts = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/product-discount-inventory-view`, {
        admin_id: adminId,
        action: "inventory"
      });

      if (response.data.status_code === 200 && response.data.products) {
        setProducts(response.data.products);
      } else {
        setError(response.data.message || 'No inventory products found.');
        displayPopup(response.data.message || 'No inventory products found.', "error");
      }
    } catch (err) {
      setError('Failed to fetch products.');
      displayPopup('Failed to fetch products.', "error");

    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/download-inventory-products-excel`,
        { admin_id: adminId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Products_Inventory_Details.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      displayPopup('Failed to download Excel.', "error");

    }
  };
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

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
    <div className="recent-orders">
      <div className="discount-header">
        <h3>Sold Quantity Products Details</h3>
        <div className="discount-buttons admin-rating-buttons">
          <button onClick={downloadExcel}>Download Excel</button>
        </div>
      </div>

      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      {error && <p className="error-message">{error}</p>}
      {!isLoading && (

        <>
          <div className="customer-table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Category Name</th>
                  <th>SubCategory Name</th>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>HSN</th>
                  <th>Quantity</th>
                  <th>Sold Quantity</th>
                  <th>Price</th>
                  <th>Discount(%)</th>
                  <th>Final Price</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>{indexOfFirstProduct + index + 1}</td>
                    <td>{product.category}</td>
                    <td>{product.sub_category}</td>
                    <td>
                      <img
                        src={product.product_images[0]}
                        alt={product.product_name}
                        width="50"
                        height="50"
                        className="product-image"
                      />
                    </td>
                    <td>{product.product_name}</td>
                    <td>{product.sku_number}</td>
                    <td>{product.hsn_code}</td>
                    <td>{product.quantity}</td>
                    <td>{product.total_quantity_sold}</td>
                    <td>₹ {product.price.toFixed(2)}</td>
                    <td>{product.discount}</td>
                    <td>₹ {product.final_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <button
              className="first-button"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
            >
              First
            </button>

            <button
              className="previous-button"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              className="next-button"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>

            <button
              className="last-button"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </>
      )}
    </div>

  );
};

export default AdminInventoryProducts;