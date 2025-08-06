import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminCustomerDashboard.css";
import { FaUserCheck, FaUserTimes, FaUsers } from "react-icons/fa";
import API_BASE_URL from "../../config";
import { ClipLoader } from "react-spinners";

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activatedCount, setActivatedCount] = useState(0);
    const [inactivatedCount, setInactivatedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const customersPerPage = 10;

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const adminId = sessionStorage.getItem("admin_id");
                if (!adminId) {
                    setError("Admin session expired. Please log in again.");
                    navigate("/admin-login");
                    return;
                }

                const requestBody = { admin_id: adminId };
                const response = await axios.post(`${API_BASE_URL}/get-customer-by-admin/`, requestBody);

                if (response.data.status === "success" && Array.isArray(response.data.customers)) {
                    setCustomers(response.data.customers);
                    setActivatedCount(response.data.activated_count || 0);
                    setInactivatedCount(response.data.inactivated_count || 0);
                    setTotalCount(response.data.total_count || 0);
                } else {
                    console.error("API Error:", response.data.error);
                    setError("Failed to fetch customers.");
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
                setError("Something went wrong while fetching customers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const toggleStatus = async (customerId, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const response = await axios.post(`${API_BASE_URL}/update-customer-status/`, {
                customer_id: customerId,
                account_status: newStatus,
            });

            if (response.data.status === "success") {
                setCustomers(prev =>
                    prev.map(c =>
                        c.id === customerId ? { ...c, account_status: newStatus } : c
                    )
                );
                if (newStatus === 1) {
                    setActivatedCount(prev => prev + 1);
                    setInactivatedCount(prev => prev - 1);
                } else {
                    setActivatedCount(prev => prev - 1);
                    setInactivatedCount(prev => prev + 1);
                }

            } else {
                console.error("Failed to update status:", response.data.error);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    const currentCustomers = customers.slice(indexOfFirstCustomer, indexOfLastCustomer);
    const totalPages = Math.ceil(customers.length / customersPerPage);

   const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const formatMobileNumber = (mobileNo) => {
        if (!mobileNo) return '';
        
        const digitsOnly = mobileNo.replace(/\D/g, '');
        
        
        if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
            return `+91 ${digitsOnly.substring(2)}`;
        }
        
        else if (digitsOnly.length === 10) {
            return `+91 ${digitsOnly}`;
        }
        
        else if (digitsOnly.length > 10) {
            const countryCode = digitsOnly.substring(0, digitsOnly.length - 10);
            const mainNumber = digitsOnly.substring(digitsOnly.length - 10);
            return `+${countryCode} ${mainNumber}`;
        }
    
        return mobileNo;
    };

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
        <>
            <div className="dashboard-cards">
                <div className=" card-first">
                <div><FaUserCheck className="dashboard-icon activated-icon" /></div>
                    <h3>Activated</h3>
                    <p>{activatedCount}</p>
                </div>
                <div className="card-second">
                  <div> <FaUserTimes className="dashboard-icon inactivated-icon" /></div>
                    <h3>Inactivated</h3>
                    <p>{inactivatedCount}</p>
                </div>
                <div className=" card-third">
                <div><FaUsers className="dashboard-icon total-icon" /></div>
                    <h3>Total</h3>
                    <p>{totalCount}</p>
                </div>
            </div>

            <div className="recent-orders">
                <h3>Customer List</h3>
                {error && <p className="error-message">{error}</p>}
           
                        <div className="customer-table-container">
                            <table className="customer-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Mobile No</th>
                                        <th>Register Type</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentCustomers.map((customer, index) => (
                                        <tr key={customer.id}>
                                            <td>{indexOfFirstCustomer + index + 1}</td>
                                            <td>{`${customer.first_name} ${customer.last_name}`}</td>
                                            <td className="admin-mail">{customer.email.toLoweCase()}</td>
                                            <td>{formatMobileNumber(customer.mobile_no)}</td>
                                            <td>{customer.register_type}</td>
                                            <td>
                                                <button
                                                    className={`status-btn ${customer.account_status === 1 ? "activated" : "inactivated"}`}
                                                    onClick={() => toggleStatus(customer.id, customer.account_status)}
                                                >
                                                    {customer.account_status === 1 ? "Activated" : "Inactivated"}
                                                </button>
                                            </td>
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
            </div>
        </>
    );
};

export default Customer;