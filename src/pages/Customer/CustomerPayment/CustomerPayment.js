
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PopupMessage from "../../../components/Popup/Popup";
import API_BASE_URL from "../../../config";

const RazorpayPayment = ({ orderSummary, setPaymentLoading }) => {
    const navigate = useNavigate();
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const hasRun = useRef(false);

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
    };

    useEffect(() => {
        return () => {
            if (setPaymentLoading) {
                setPaymentLoading(false);
            }
        };
    }, [setPaymentLoading]);

    useEffect(() => {
        if (!hasRun.current && orderSummary && orderSummary.orders?.length > 0) {
            hasRun.current = true;
            handlePayment();
        }
    }, [orderSummary]);

    const handlePayment = async () => {
        const customerId = localStorage.getItem("customer_id");
        if (!customerId || !orderSummary.orders.length) {
            displayPopup("Customer ID and Order details are required.", "error");
            return;
        }

        const orderProducts = orderSummary.orders.map(order => ({
            order_id: order.order_id,
            product_id: order.product_id
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/create-razorpay-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customerId,
                    order_products: orderProducts
                }),
            });

            const orderData = await response.json();

            if (!response.ok) throw new Error(orderData.error || "Failed to create Razorpay order.");

            const options = {
                key: orderData.razorpay_key,
                amount: orderData.total_amount * 100,
                currency: "INR",
                name: "Dronekits",
                description: `Payment for Order(s): ${orderProducts.map(o => o.order_id).join(", ")}`,
                order_id: orderData.razorpay_order_id,
                handler: async () => {
                    displayPopup("Payment Successful!", "success");
                    setTimeout(() => navigate("/my-orders"), 5000);
                },
                prefill: {
                    name: orderData.customer_name || "Customer",
                    email: orderData.email || "customer@example.com",
                    contact: orderData.mobile_no || "9876543210",
                },
                theme: { color: "#3399cc" },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
            if (setPaymentLoading) setPaymentLoading(false);
        } catch (error) {
            displayPopup("Error: " + error.message, "error");
        }
    };

    return (
        <div className="popup-cart">
            {showPopup && (
                <PopupMessage
                    message={popupMessage.text}
                    type={popupMessage.type}
                    onClose={() => setShowPopup(false)}
                />
            )}
        </div>
    );
};

export default RazorpayPayment;


