import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../config";
const CustomerMobileVerification = () => {
    const [mobile, setMobile] = useState("");
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const location = useLocation();
    const navigate = useNavigate();
    const userId = "17";

    if (!userId) {
        navigate("/customer-login");
        return null;
    }

    const handleSubmitMobile = async () => {
        if (!mobile) {
            setPopupMessage({ text: "Mobile number is required.", type: "error" });
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/google-submit-mobile`, {
                user_id: userId,
                mobile_no: mobile,
            });

            if (response.data.message) {
                setPopupMessage({ text: response.data.message, type: "success" });
                navigate("/");
            }
        } catch (error) {
            setPopupMessage({ text: error.response?.data?.error || "Mobile submission failed.", type: "error" });
        }
    };

    return (
        <div>
            <h2>Mobile Verification</h2>
            {popupMessage.text && <div className={popupMessage.type}>{popupMessage.text}</div>}
            <input
                type="text"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
            />
            <button onClick={handleSubmitMobile}>Submit</button>
        </div>
    );
};

export default CustomerMobileVerification;
