import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../../config";
import PopupMessage from "../../../components/Popup/Popup";
import "./CustomerViewWishlist.css";
import { BiSolidCartAdd } from "react-icons/bi";
import { useNavigate, Link } from "react-router-dom";
import { ClipLoader } from "react-spinners";

const ViewWishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const navigate = useNavigate();
    const customerId = localStorage.getItem("customer_id");

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 10000);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [screenSize, setScreenSize] = useState({
        width: window.innerWidth,
        productsPerRow: calculateProductsPerRow(window.innerWidth)
    });
    const rowsPerPage = 2;
    const productsPerPage = screenSize.productsPerRow * rowsPerPage;

    function calculateProductsPerRow(width) {
        if (width >= 1920) return 6;
        if (width >= 1440) return 5;
        if (width >= 1200) return 4;
        if (width >= 992) return 3;
        if (width >= 768) return 2;
        return 1;
    }

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setScreenSize({
                width,
                productsPerRow: calculateProductsPerRow(width)
            });
            setCurrentPage(1);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const response = await axios.post(`${API_BASE_URL}/view-wishlist`, {
                    customer_id: customerId,
                });

                if (response.data.status === "success") {
                    setWishlist(response.data.data);
                    setWishlistCount(response.data.data.length);
                } else {
                    displayPopup("Failed to fetch wishlist.", "error");
                }
            } catch (error) {
                displayPopup("Failed to fetch wishlist.", "error");
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchWishlist();
        } else {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to view your wishlist.
                </>,
                "error"
            );
            navigate("/customer-login");
            setLoading(false);
        }
    }, [customerId]);

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = wishlist.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(wishlist.length / productsPerPage);

    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const handleAddCart = async (productId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/add-cart-product`, {
                customer_id: customerId,
                product_id: productId,
                // quantity: 1,
            });
            if (response.data.status_code === 200) {
                displayPopup("Product added to cart!");
            } else {
                displayPopup("Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("Error adding to cart.", "error");
        }
    };

    const handleViewProductDetails = (product) => {
        const category_id = product.category_id;
        const sub_category_id = product.subcategory_id;
        const categoryName = product.category_name;
        const subCategoryName = product.subcategory_name;

        localStorage.setItem("category_id", category_id);
        localStorage.setItem("sub_category_id", sub_category_id);
        localStorage.setItem("category_name", categoryName);
        localStorage.setItem("sub_category_name", subCategoryName);
        localStorage.setItem("product_name", product.product_name);

        navigate(`/product-details/${categoryName}/${subCategoryName}/${product.product_id}`, {
            state: {
                category_name: categoryName,
                sub_category_name: subCategoryName,
                product_name: product.product_name,
            },
        });
    };


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
        <div>
            <div className="wishlist-header">
                <span className="wishlist-heading">My Wishlist</span>
                <span className="wishlist-count">({wishlistCount} items)</span>
            </div>
            <div className="wishlist-container container">
                {showPopup && (
                    <div className="popup-discount">
                        <PopupMessage
                            message={popupMessage.text}
                            type={popupMessage.type}
                            onClose={() => setShowPopup(false)}
                        />
                    </div>
                )}

                <div className="customer-products-section">
                    {currentProducts.length > 0 ? (
                        currentProducts.map((product) => (
                            <div
                                key={product.product_id}
                                className="customer-product-card"
                                onClick={() => handleViewProductDetails(product)}
                            >
                                <img
                                    src={product.product_image}
                                    alt={product.product_name}
                                    className="customer-product-image"
                                />
                                <div className="customer-product-name">{product.product_name}</div>
                                <div className="customer-discount-section-price">
                                    ₹{product.final_price}.00 (incl. GST)
                                </div>
                                <div>
                                    <div className="customer-discount-section-original-price">
                                        {product.price !== product.final_price ? (
                                            <>
                                                ₹{product.price}.00 (incl. GST)
                                                <div className="discount-tag">
                                                    {product.discount && parseFloat(product.discount) > 0
                                                        ? `${product.discount} off`
                                                        : ''}
                                                </div>
                                            </>
                                        ) : (
                                            <>&nbsp;</>
                                        )}
                                    </div>
                                    <div className="add-cart-section">
                                        <span
                                            className={`availability ${product.availability === "Out of Stock"
                                                ? "out-of-stock"
                                                : product.availability === "Very Few Products Left"
                                                    ? "few-left"
                                                    : "in-stock"
                                                }`}
                                        >
                                            {product.availability}
                                        </span>

                                        {(product.availability === "Very Few Products Left" ||
                                            product.availability === "In Stock") && (
                                                <BiSolidCartAdd
                                                    className="add-to-cart-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddCart(product.product_id);
                                                    }}
                                                />
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-products-message">No products in your wishlist.</div>
                    )}
                </div>
                {wishlist.length > productsPerPage && (
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
                )}
            </div>
        </div>
    );
};

export default ViewWishlist;
