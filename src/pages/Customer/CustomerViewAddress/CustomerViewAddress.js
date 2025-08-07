import { useEffect, useState, useRef } from "react";
import EditAddress from "../CustomerEditAddress/CustomerEditAddress";
import "../CustomerViewAddress/CustomerViewAddress.css";
import { BsThreeDotsVertical } from "react-icons/bs";
import PopupMessage from "../../../components/Popup/Popup";
import API_BASE_URL from "../../../config";
import { ClipLoader } from "react-spinners";

const ViewCustomerAddress = ({ refresh, setOrderSummary, isAddOpen, onDeliverHere, onAddressSelect, onAddAddressClick }) => {
    const [addresses, setAddresses] = useState([]);
    const [editingAddress, setEditingAddress] = useState(null);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState(null);
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const customerId = localStorage.getItem("customer_id");
    const menuRef = useRef(null);
    const menuRefs = useRef({});

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            let clickedInside = false;
            Object.values(menuRefs.current).forEach(ref => {
                if (ref && ref.contains(event.target)) {
                    clickedInside = true;
                }
            });

            if (!clickedInside) {
                setMenuOpenFor(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/view-customer-address`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: customerId }),
            });
            const data = await response.json();
            if (response.ok) {
                setAddresses(data.addresses);
            } else {
                if (data.error !== "No address found for the given customer ID.") {
                    displayPopup(data.error || "Failed to fetch addresses", "error");
                }
                setAddresses([]);
            }

        } catch (error) {
            displayPopup("Something went wrong while fetching addresses.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchAddresses();
        }
    }, [customerId, refresh]);

    const handleEditClick = (address) => {
        setEditingAddress(address);
        setMenuOpenFor(null);
    };

    const handleEditCompleted = (message) => {
        setEditingAddress(null);
        if (message) {
            displayPopup(message);
            fetchAddresses();
        }
    };

    const handleDeleteClick = (addressId) => {
        setAddressToDelete(addressId);
        setShowConfirmPopup(true);
        setMenuOpenFor(null);
    };

    const confirmDelete = async () => {
        setShowConfirmPopup(false);
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/delete-customer-address`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address_id: addressToDelete, customer_id: customerId }),
            });
            const data = await response.json();
            if (response.ok) {
                displayPopup("Address deleted successfully", "success");
                fetchAddresses();
            } else {
                displayPopup(data.error || "Failed to delete address", "error");
            }
        } catch (error) {
            displayPopup("Something went wrong during deletion", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSelect = (id) => {
        setSelectedAddressId(id);
    };

    const handleOrderSummary = async () => {
        if (!selectedAddressId) {
            displayPopup("Please select a delivery address.", "error");
            return;
        }

        const orderIds = JSON.parse(localStorage.getItem("order_ids")) || [];
        const productIds = JSON.parse(localStorage.getItem("product_ids")) || [];

        if (!orderIds.length || !productIds.length) {
            displayPopup("Missing order or product details.", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/products/order-multiple-products-summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customerId,
                    address_id: selectedAddressId,
                    order_ids: orderIds,
                    product_ids: productIds,
                }),
            });

            const data = await response.json();
            if (response.ok && data.status_code === 200) {
                const selectedAddr = addresses.find(addr => addr.address_id === selectedAddressId);
                setOrderSummary({
                    orders: data.orders,
                    shippingAddress: data.shipping_address,
                    order_id: data.order_id,
                    customer_id: customerId,
                    total_amount: data.total_amount,
                    product_name: data.product_name,
                });
                onDeliverHere();
                if (selectedAddr) {
                    onAddressSelect(selectedAddr);
                }
            } else {
                displayPopup(data.error || "Failed to load summary.", "error");
            }
        } catch (error) {
            displayPopup("Something went wrong. Try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleMenuToggle = (addressId) => {
        setMenuOpenFor((prev) => (prev === addressId ? null : addressId));
    };


    if (loading && addresses.length === 0) {
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
        <div className="address-list container">
            <h3 className="address-heading">Delivery Address</h3>
            {!isAddOpen && (

                <div className="add-address-btn-section container">

                    <button className="add-address-btn" onClick={onAddAddressClick}>Add Address</button>

                </div>

            )}
            <div className="popup-cart">
                {showPopup && (
                    <PopupMessage
                        message={popupMessage.text}
                        type={popupMessage.type}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </div>

            {showConfirmPopup && (
                <div className="confirm-popup-overlay">
                    <div className="confirm-popup">
                        <p>Are you sure you want to delete this address?</p>
                        <div className="popup-buttons">
                            <button className="cart-place-order" onClick={confirmDelete}>Yes, Delete</button>
                            <button className="cart-delete-selected" onClick={() => setShowConfirmPopup(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {addresses.length > 0 ? (
                addresses.map((address) => (
                    <div key={address.address_id} className="address-list-item">
                        <div className="address-item">
                            <div className="address-header">
                                <input
                                    type="radio"
                                    name="deliveryAddress"
                                    className="address-radio-btn"
                                    checked={selectedAddressId === address.address_id}
                                    onChange={() => handleAddressSelect(address.address_id)}
                                />
                            </div>
                            <div className="address-details-section">

                                <label className="address-details" onClick={() => handleAddressSelect(address.address_id)}>

                                    <p><strong>{address.first_name} {address.last_name}</strong>{" "}

                                        <strong>{address.phone || address.mobile_number || address.contact_number}</strong>

                                    </p>

                                    <p>{address.street}, {address.village},{address.mandal} ,{address.district}, {address.state}-

                                        <strong>{address.pincode}</strong></p>

                                </label>

                            </div>
                            {!isAddOpen && (
                                <div className="menu-container" ref={el => (menuRefs.current[address.address_id] = el)}>

                                    <BsThreeDotsVertical
                                        className="menu-icon"
                                        onClick={() => handleMenuToggle(address.address_id)}
                                    />
                                    {menuOpenFor === address.address_id && (
                                        <div className="manage-edit-menu-dropdown">
                                            <button className="manage-edit-btn" onClick={() => handleEditClick(address)}>Edit</button>
                                            <button className="manage-delete-btn" onClick={() => handleDeleteClick(address.address_id)} disabled={loading}>
                                                {loading ? <ClipLoader size={15} color="#ffffff" /> : "Delete"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {editingAddress?.address_id === address.address_id && !isAddOpen && (
                            <EditAddress
                                address={editingAddress}
                                onEditCompleted={handleEditCompleted}
                            />
                        )}

                        {selectedAddressId === address.address_id && (
                            <button className="address-del-btn" onClick={handleOrderSummary} disabled={loading}>
                                {loading ? <ClipLoader size={15} color="#ffffff" /> : "Deliver Here"}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p>No saved addresses found.</p>
            )}
        </div>
    );
};

export default ViewCustomerAddress;