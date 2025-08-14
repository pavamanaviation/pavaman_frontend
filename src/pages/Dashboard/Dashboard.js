import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/Dashboard.css";
import { SlPeople } from "react-icons/sl";
import { FaBoxOpen } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config";
import { ClipLoader } from "react-spinners";

const Dashboard = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [topBuyers, setTopBuyers] = useState([]);
    const [currentMonthOrders, setCurrentMonthOrders] = useState(null);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const navigate = useNavigate();
    const admin_id = sessionStorage.getItem("admin_id");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    fetchSummary(),
                    fetchTopBuyers(),
                    fetchMonthlyOrders()
                ]);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([
                    fetchSummary(),
                    fetchTopBuyers(),
                    fetchMonthlyOrders(),
                    fetchReports() // added here
                ]);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
                setError("Failed to load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const fetchReports = async () => {
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminId) {
            setError("Admin session expired. Please log in again.");
            return;
        }
        const response = await axios.post(
            `${API_BASE_URL}/get-payment-details-by-order`,
            { admin_id: adminId }
        );
        if (response.data.status_code === 200 && Array.isArray(response.data.payments)) {
            setReports(response.data.payments);
        } else {
            setError("Failed to load report data.");
        }
    };


    const fetchSummary = async () => {
        const response = await axios.post(`${API_BASE_URL}/report-inventory-summary`, { admin_id });
        setSummaryData(response.data);
        setLowStockProducts(response.data.low_stock_products || []);

    };

    const fetchTopBuyers = async () => {
        const response = await axios.post(`${API_BASE_URL}/top-buyers-report`, { admin_id });
        setTopBuyers(response.data.buyers || []);

    };

    const fetchMonthlyOrders = async () => {
        const response = await axios.post(`${API_BASE_URL}/monthly-product-orders`, { admin_id });
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentData = response.data.data.find((item) => item.month === currentMonth);
        setCurrentMonthOrders(currentData ? currentData.total_quantity : 0);

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
        <div className="dashboard-container">
            <div className="dashboard-cards">
                <div className="dashboard-card card-sales-first">
                    <h3 className='today-heading'><FaBoxOpen className="today-icon" /> Total Products</h3>
                    <p>{summaryData?.total_products ?? "-"}</p>
                </div>
                <div className="dashboard-card card-sales-second">
                    <h3 className='today-heading'><SlPeople className="monthly-icon" />Total Customers</h3>
                    <p>{summaryData?.total_customers ?? "-"}</p>
                </div>
                <div className="dashboard-card card-sales-third">
                    <h3 className='today-heading'><FaBoxOpen className="yearly-icon" />Monthly Products Ordered</h3>
                    <p>{currentMonthOrders !== null ? `${currentMonthOrders}` : "-"}</p>
                </div>
            </div>
            <div className="dashboard-tables">
                <h2>New Orders</h2>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>S.no</th>
                            <th>Customer Name</th>
                            <th>Mobile Number</th>
                            <th>Product name</th>
                            <th>Amount</th>
                            <th>Order Id</th>
                            <th>Created Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length > 0 ? (
                            reports.slice(0, 10).map((order, index) => (
                                <tr key={order.payment_id}>
                                    <td>{index + 1}</td>
                                    <td>{order.customer_name}</td>
                                    <td>{order.mobile_number}</td>
                                    <td>{order.order_products?.[0]?.product_name || "-"}</td>
                                    <td>{order.total_amount}</td>
                                    <td>{order.product_order_id}</td>
                                    <td>{order.payment_date}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>No new orders</td>
                            </tr>
                        )}
                    </tbody>


                </table>

                <button className="view-more-button" onClick={() => navigate("/orders")}>View More ...</button>
            </div>
            <div className="dashboard-tables">

                <div className="dashboard-top-buyers">
                    <h2>Top Buyers</h2>
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Products Bought</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topBuyers.slice(0, 5).map((buyer) => (
                                <tr key={buyer.customer_id}>
                                    <td>{buyer.name}</td>
                                    <td>{buyer.product_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {topBuyers.length > 5 && (
                        <button className="view-more-button" onClick={() => navigate("/top-buyers")}>
                            View More...
                        </button>
                    )}
                </div>


                {lowStockProducts.length > 0 && (
                    <div className="dashboard-low-stock">
                        <h2>Low Stock Products</h2>
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProducts.slice(0, 5).map((product) => (
                                    <tr key={product.product_id}>
                                        <td>{product.product_name}</td>
                                        <td>{product.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {lowStockProducts.length > 5 && (
                            <button className="view-more-button" onClick={() => navigate("/low-stock-products")}>
                                View More...
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
