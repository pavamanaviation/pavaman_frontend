import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCustomerOrders.css";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import generateInvoicePDF from '../Customer/CustomerInvoice/CustomerInvoice';
import API_BASE_URL from "../../config";
import { ClipLoader } from "react-spinners";

const Report = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 15;
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminId) {
          setError("Admin session expired. Please log in again.");
          return;
        }
        const response = await axios.post(
          `${API_BASE_URL}/get-payment-details-by-order`,
          { admin_id: adminId }
        );
        if (
          response.data.status_code === 200 &&
          Array.isArray(response.data.payments)
        ) {
          setReports(response.data.payments);
        } else {
          setError("Failed to load report data.");
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Something went wrong while fetching reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  if (loading) {
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
      <h2 className="report-title report-title-heading">Ordered Payment Reports</h2>
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <>
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Name</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Razorpay Order ID</th>
                  <th>Invoice</th>
                  <th>Shipping Status</th>
                  <th>Delivery Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report, index) => {
                  const orderId = report.razorpay_order_id;
                  return (
                    <tr key={index}>
                      <td className="order-table-data">{indexOfFirstReport + index + 1}</td>
                      <td className="order-table-data">{report.customer_name}</td>
                      <td className="order-table-data">{report.payment_date}</td>
                      <td className="order-table-data">₹{report.total_amount}</td>
                      <td className="order-table-data payment-mode">{report.payment_mode}</td>
                      <td>{orderId}</td>
                      <td className="order-table-data payment-mode">
                        <button
                          className="invoice-button-customer-order"
                          onClick={() => generateInvoicePDF(report.customer_id, report, 'view')}
                          title="View Invoice"
                        >
                          <FaEye />
                        </button>
                      </td>
                      <td className="order-table-data payment-mode">
                        {report.order_products && report.order_products.length > 0
                          ? report.order_products.map((product, index) => (
                            <div key={index}>
                              {product.shipping_status}
                            </div>
                          ))
                          : "N/A"}
                      </td>
                      <td className="order-table-data payment-mode">
                        {report.order_products && report.order_products.length > 0
                          ? report.order_products.map((product, index) => (
                            <div key={index}>
                              {product.delivery_status}
                            </div>
                          ))
                          : "N/A"}
                      </td>
                      <td>
                        <Link to={`/admin-order-details/${orderId}`} className="view-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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

export default Report;
