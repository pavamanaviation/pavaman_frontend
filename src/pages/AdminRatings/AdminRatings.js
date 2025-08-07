import { useState, useEffect } from 'react';
import API_BASE_URL from "../../config";
import "./AdminRatings.css";
import axios from 'axios';
import PopupMessage from "../../components/Popup/Popup";
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

const AdminRatings = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const adminId = sessionStorage.getItem("admin_id");
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);
  const displayPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 5000);
  };
  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/retrieve-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ admin_id: adminId, action: "customer_rating" }),
        });
        const data = await response.json();
        if (response.ok) {
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedData = data.feedback.slice(startIndex, startIndex + itemsPerPage);
          setFeedbackList(paginatedData);
          setTotalPages(Math.ceil(data.feedback.length / itemsPerPage));
        } else {
          setError(data.error || 'An error occurred');
          displayPopup(data.error || 'An error occurred', "error");
        }
      } catch (err) {
        setError('Server error: ' + err.message);
        displayPopup('Server error: ' + err.message, "error");

      } finally {
        setIsLoading(false);
      }
    };
    fetchFeedback();
  }, [adminId, currentPage]);


  const downloadExcel = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/download-feedback-excel`,
        { admin_id: adminId },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'feedback_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      displayPopup('Failed to download Excel.', "error");
    }
  };
  const navigateToAverageRatings = () => {
    navigate("/average-ratings");
  };

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
    <div className="report-wrapper">
      <div className="discount-header">
        <h3 className="report-title heading-admin">Feedback Reports</h3>
        <div className='discount-buttons admin-rating-buttons'>
          <button className='cart-place-order-average-btn ' onClick={navigateToAverageRatings}>Average Rating Page</button>
          <button className='cart-place-order' onClick={downloadExcel}>Download Excel</button>
        </div>
      </div>
      <div className="admin-popup">
        <PopupMessage message={popupMessage.text} type={popupMessage.type} show={showPopup} />
      </div>
      {error && <p className="error-text">{error}</p>}
      {!isLoading && !error && (
        <>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Product Image</th>
                  <th>Product Name</th>
                  <th>Order ID</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Created At</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((item, index) => (
                  <tr key={index}>
                    <td className="order-table-data">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="order-table-data"><img src={item.product_image} className=' ratings-image' /></td>
                    <td className="order-table-data">{item.product_name}</td>
                    <td className="order-table-data">{item.order_id}</td>
                    <td className="order-table-data">{item.rating}</td>
                    <td className="order-table-data">{item.feedback}</td>
                    <td className="order-table-data">{item.created_at}</td>
                    <td className="order-table-data">{item.customer_name}</td>
                    <td className="order-table-data text-style">{item.customer_email}</td>
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

export default AdminRatings;