import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfile.css";
import CustomerIcon from "../../../assets/images/contact-icon.avif";
import { BiSolidPencil } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import API_BASE_URL from "../../../config";
import { ClipLoader } from "react-spinners";

const CustomerProfile = ({ refresh }) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
  const [showPopup, setShowPopup] = useState(false);

  const customerId = localStorage.getItem("customer_id");
  const [editField, setEditField] = useState(null);
  const [tempData, setTempData] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [oldOtp, setOldOtp] = useState("");
  const [newOtp, setNewOtp] = useState("");

  const [step, setStep] = useState(1);
  const [newMobileOtpSent, setNewMobileOtpSent] = useState(false);
  const [showNewMobileOtpField, setShowNewMobileOtpField] = useState(false);
  const fetchCustomerProfile = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/get-customer-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      });

      const data = await response.json();
      if (response.ok) {
        setCustomer(data.profile);
      } else {
        setError(data.error || "Failed to fetch customer profile");
        triggerPopup(data.error || "Failed to fetch customer profile", "error");
      }
    } catch (error) {
      const message = "Fetch error: " + error.message;
      setError(message);
      triggerPopup(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerPopup = (text, type) => {
    setPopupMessage({ text, type });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 5000);
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [customerId, refresh]);

  if (!customerId) {
    return (
      <div className="customer-profile-container">
        <div className="customer-not-logged-in-box">
          Customer is not logged in.
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="customer-profile-container">
        <div className="customer-error">{error}</div>
      </div>
    );
  }

const handleEditClick = (field) => {
  setEditField(field);
  setOtp("");
  setOtpSent(false);

  if (field === "mobile_no") {
    setTempData({
      mobile_no: customer.mobile_no || "",
      new_mobile_no: "",
    });
  } else {
    setTempData({ ...customer });
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value, name) => {
    setTempData((prev) => ({ ...prev, [name]: value, }));
  };


  const sendPreviousEmailOtp = async () => {
    const response = await fetch(`${API_BASE_URL}/edit-profile-email`, {
      method: "POST",
       credentials: "include",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({
        action: "send_previous_otp",
        customer_id: customerId,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setOtpSent(true);
      triggerPopup(data.message, "success");
    } else {
      triggerPopup(data.error, "error");
    }
  };

  const verifyPreviousEmailOtp = async () => {
    const response = await fetch(`${API_BASE_URL}/edit-profile-email`, {
      method: "POST",
       credentials: "include",

      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_previous_otp",
        customer_id: customerId,
        otp,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      triggerPopup("Previous email verified successfully", "success");
      setStep(2);
      setOtp("");
      setOtpSent(false);
      setTempData((prevData) => ({
        ...prevData,
        email: "",
      }));

    } else {
      triggerPopup(data.error, "error");
    }
  };

  const sendNewEmailOtp = async () => {
    if (!tempData.email) {
      triggerPopup("Please enter new email first", "error");
      return;
    }
    const response = await fetch(`${API_BASE_URL}/edit-profile-email`, {
      method: "POST",
       credentials: "include",

      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_new_otp",
        customer_id: customerId,
        email: tempData.email,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setOtpSent(true);
      triggerPopup(data.message, "success");
    } else {
      triggerPopup(data.error, "error");
    }
  };

  const verifyNewEmailOtpAndUpdate = async () => {
    const response = await fetch(`${API_BASE_URL}/edit-profile-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" ,"withCredentials": true},
      body: JSON.stringify({
        action: "verify_new_otp",
        customer_id: customerId,
        otp,
        email: tempData.email,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      triggerPopup(data.message, "success");
      fetchCustomerProfile();
      setEditField(null);
    } else {
      triggerPopup(data.error, "error");
    }
  };

  const sendMobileOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-profile-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_previous_otp",
          customer_id: customerId,
          mobile_no: tempData.mobile_no.replace(/^\+/, ""),
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        triggerPopup(data.message, "success");
      } else {
        triggerPopup(data.error || "Failed to send OTP", "error");
      }
    } catch (error) {
      triggerPopup("Network error. Please try again.", "error");
      console.error(error);
    }
  };

  const verifyMobileOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-profile-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_previous_otp",
          customer_id: customerId,
          otp,
          mobile_no: tempData.mobile_no.replace(/^\+/, ""), // <-- remove +
        }),
      });
      const data = await response.json();

      if (response.ok) {
        triggerPopup(data.message, "success");
        setOtp("");
        setOtpSent(false);
        setNewMobileOtpSent(true);
        setTempData((prevData) => ({
          ...prevData,
          mobile_no: "",
        }));
      } else {
        triggerPopup(data.error || "OTP verification failed", "error");
      }
    } catch (error) {
      triggerPopup("Network error. Please try again.", "error");
      console.error(error);
    }
  };

  const sendNewMobileOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-profile-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_new_otp",
          customer_id: customerId,
          mobile_no: (tempData.new_mobile_no || "").replace(/^\+/, ""),

        }),
      });
      const data = await response.json();

      if (response.ok) {
        triggerPopup(data.message, "success");
        setShowNewMobileOtpField(true);
      } else {
        triggerPopup(data.error || "Failed to send OTP to new mobile", "error");
      }
    } catch (error) {
      triggerPopup("Network error. Please try again.", "error");
      console.error(error);
    }
  };

  const verifyNewMobileOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-profile-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_new_otp",
          customer_id: customerId,
          otp: newOtp,
          mobile_no: (tempData.new_mobile_no || "").replace(/^\+/, ""),

        }),
      });
      const data = await response.json();

      if (response.ok) {
        triggerPopup(data.message, "success");
        fetchCustomerProfile();
        setEditField(null);
        setOtp("");
        setNewMobileOtpSent(false);
        setShowNewMobileOtpField(false);
        setTempData((prev) => ({
          ...prev,
          mobile_no: prev.new_mobile_no,
          new_mobile_no: "",
        }));
      } else {
        triggerPopup(data.error || "OTP verification failed", "error");
      }
    } catch (error) {
      triggerPopup("Network error. Please try again.", "error");
      console.error(error);
    }
  };


  const updateName = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/edit-customer-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          first_name: tempData.first_name,
          last_name: tempData.last_name,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        triggerPopup(data.message, "success");
        fetchCustomerProfile();
        setEditField(null);
      } else {
        triggerPopup(data.error || "Failed to update name", "error");
      }
    } catch (error) {
      triggerPopup("Update error: " + error.message, "error");
    }
  };


  return (
    <div className="customer-profile-container">
      {showPopup && (
        <div className={`popup-message ${popupMessage.type}`}>
          {popupMessage.text}
        </div>
      )}

      <div className="customer-profile-card">
        <div className="customer-avatar-section">
          <img src={CustomerIcon} alt="Customer" className="customer-avatar" />
          <div className="customer-avatar-name">
            {customer.first_name} {customer.last_name}
          </div>
        </div>

        <div className="customer-profile-header">
          <h3 className="profile-edit-main-heading">Personal Information</h3>
          <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("name")} />
        </div>
        <div className="customer-input-row">
          <h3 className="profile-edit-heading">First Name</h3>
          <input type="text" value={customer.first_name || "-"} readOnly className="customer-input-row-profile" />
          <h3 className="profile-edit-heading">Last Name</h3>
          <input type="text" value={customer.last_name || "-"} readOnly className="customer-input-row-profile" />
        </div>

        <div className="customer-profile-header">
          <h3 className="profile-edit-heading">Email Address</h3>
          <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("email")} />
        </div>
        <div className="customer-input-single">
          <input type="email" value={customer.email || "-"} readOnly className="customer-input-row-profile" />
        </div>

        <div className="customer-profile-header">
          <h3 className="profile-edit-heading">Mobile Number</h3>
          <BiSolidPencil className="edit-icon" onClick={() => handleEditClick("mobile_no")} />
        </div>
       <div className="customer-input-single">
  <input
    type="text"
    value={
      customer.mobile_no
        ? customer.mobile_no.startsWith("+")
          ? customer.mobile_no
          : `+${customer.mobile_no}`
        : "-"
    }
    readOnly
    className="customer-input-row-profile"
  />
</div>

      </div>
      {editField === "email" && (
        <div className="edit-popup-box">
          {step === 1 && (
            <>
              <h4>Verify Current Email</h4>
              <input
                type="email"
                name="email"
                value={tempData.email}
                className="edit-input"
                disabled
              />

              {!otpSent ? (
                <button className="send-otp-btn" onClick={sendPreviousEmailOtp}>
                  Send OTP to Current Email
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP sent to Current Email"
                    className="edit-input"
                  />
                  <button className="verify-otp-btn" onClick={verifyPreviousEmailOtp}>
                    Verify OTP
                  </button>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h4>Enter New Email and Verify</h4>
              <input
                type="email"
                name="email"
                value={tempData.email}
                onChange={handleInputChange}
                placeholder="Enter New Email"
                className="edit-input"
              />

              {!otpSent ? (
                <button className="send-otp-btn" onClick={sendNewEmailOtp}>
                  Send OTP to New Email
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP sent to New Email"
                    className="edit-input"
                  />
                  <button className="verify-otp-btn" onClick={verifyNewEmailOtpAndUpdate}>
                    Verify and Update Email
                  </button>
                </>
              )}
            </>
          )}

          <FaTimes className="close-popup" onClick={() => setEditField(null)} />
        </div>
      )}


      {editField === "mobile_no" && (
        <div className="edit-popup-box">
          <h4>Edit Profile</h4>

          {!otpSent && !newMobileOtpSent && (
            <>
              <PhoneInput
                country={"in"}
                international
                withCountryCallingCode
                name="mobile_no"
                value={tempData.mobile_no || ""}
                onChange={(value) => handlePhoneChange(value, "mobile_no")}
                inputProps={{ name: "mobile_no", required: true }}
                placeholder="Current mobile number"
                required
              />
              <button className="send-otp-btn" onClick={sendMobileOtp}>
                Send OTP
              </button>
            </>
          )}

          {otpSent && !newMobileOtpSent && (
            <>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP sent to Old Mobile"
                className="edit-input"
              />
              <button className="verify-otp-btn" onClick={verifyMobileOtp}>
                Verify OTP
              </button>
            </>
          )}

          {newMobileOtpSent && (
            <>
              {!showNewMobileOtpField ? (
                <>
                  <PhoneInput
                    country={"in"}
                    international
                    withCountryCallingCode
                    value={tempData.new_mobile_no || ""}
                    onChange={(value) =>
                      setTempData((prev) => ({
                        ...prev,
                        new_mobile_no: value.startsWith("+") ? value : "+" + value,
                        
                      }))
                    }
                    inputProps={{ name: "new_mobile_no", required: true }}
                    placeholder="Enter new mobile number"
                  />
                  <button className="send-otp-btn" onClick={sendNewMobileOtp}>
                    Send OTP
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={newOtp}
                    onChange={(e) => setNewOtp(e.target.value)}
                    placeholder="Enter OTP sent to New Mobile"
                    className="edit-input"
                  />
                  <button className="verify-otp-btn" onClick={verifyNewMobileOtp}>
                    Verify OTP
                  </button>
                </>
              )}
            </>
          )}

          <FaTimes className="close-popup" onClick={() => setEditField(null)} />
        </div>
      )}

      {editField === "name" && (
        <div className="edit-popup-box">
          <h4>Edit Profile</h4>
          <div className="edit-name-fields">
            <label>
              FirstName
            </label>
            <input
              type="text"
              name="first_name"
              value={tempData.first_name}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Enter first name"
            />
          </div>
          <div className="edit-name-fields">
            <label>
              LastName
            </label>
            <input
              type="text"
              name="last_name"
              value={tempData.last_name}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Enter last name"
            />
          </div>
          <button className="verify-otp-btn" onClick={updateName}>
            Save
          </button>
          <FaTimes className="close-popup" onClick={() => setEditField(null)} />
        </div>
      )}

    </div>
  );
};

export default CustomerProfile;
