import { useEffect, useState, useRef } from "react";
import "../CustomerDiscountProducts/CustomerDiscountProducts.css";
import { useNavigate } from "react-router-dom";
import { BiSolidCartAdd } from "react-icons/bi";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import API_BASE_URL from "../../../config";
import PopupMessage from "../../../components/Popup/Popup";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { ClipLoader } from "react-spinners";

const ViewDiscountedProducts = ({ slidesToShow = 5 }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [discountedProducts, setDiscountedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);
    const sliderRef = useRef(null);
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 5000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: localStorage.getItem("customer_id") || null }),
            });
            const data = await response.json();
            if (data.status_code === 200) {
                setDiscountedProducts(data.discounted_products);
                const wishlistProductIds = data.discounted_products
                    .filter((product) => product.is_in_wishlist)
                    .map((product) => product.product_id);

                setWishlist(wishlistProductIds);
            } else {
                setError(data.error || "Failed to fetch data");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCart = async (product_id) => {
        const customer_id = localStorage.getItem("customer_id");
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to add products to cart.
                </>,
                "error"
            );
            return;
        }
        if (!product_id) {
            displayPopup("Invalid product. Please try again.", "error");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/add-cart-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: customer_id,
                    product_id: product_id,
                    quantity: 1,
                }),
            });
            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup("Product added to cart successfully!", "success");
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                displayPopup(data.error || "Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while adding to cart.", error, "error");
        }
    };

    const sliderSettings = {
        infinite: true,
        speed: 1000,
        slidesToShow,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        responsive: [
            {
                breakpoint: 1440,
                settings: {
                    slidesToShow: Math.min(slidesToShow, 5),
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(slidesToShow, 4),
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: Math.min(slidesToShow, 3),
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: Math.min(slidesToShow, 2),
                },
            },
        ],
    };


    const handleViewProductDetails = (product) => {
        if (!product.category_id || !product.sub_category_id) {
            displayPopup("Category or Subcategory ID is missing.", "error");
            return;
        }
        localStorage.setItem("category_id", product.category_id);
        localStorage.setItem("sub_category_id", product.sub_category_id);
        localStorage.setItem("category_name", product.category_name);
        localStorage.setItem("sub_category_name", product.sub_category_name);
        localStorage.setItem("product_name", product.product_name);
        navigate(`/product-details/${product.category_name}/${product.sub_category_name}/${product.product_id}`, {
            state: {
                category_name: product.category_name,
                sub_category_name: product.sub_category_name,
                product_name: product.product_name,
            },
        });
    };

const toggleWishlist = async (product_id) => {
    const customer_id = localStorage.getItem("customer_id");
    if (!customer_id) {
        displayPopup(
            <>
                Please <Link to="/customer-login" className="popup-link">log in</Link> to manage wishlist.
            </>,
            "error"
        );
        return;
    }

    const isInWishlist = wishlist.includes(product_id);
    const endpoint = isInWishlist ? "remove-wishlist" : "add-to-wishlist";

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customer_id, product_id }),
        });

        const data = await response.json();

        if (data.status_code === 200) {
            displayPopup(
                isInWishlist ? "Removed from wishlist." : "Added to wishlist.",
                "success"
            );

            setWishlist((prev) =>
                isInWishlist
                    ? prev.filter((id) => id !== product_id)
                    : [...prev, product_id]
            );
        } else {
            displayPopup(data.message || "Something went wrong.", "error");
        }
    } catch (error) {
        displayPopup("An error occurred while updating wishlist.", "error");
    }
};



    const renderProductCard = (product) => (
        <div
            key={product.product_id}
            className="customer-discount-product-card"
            onClick={() => handleViewProductDetails(product)}
        >
            <div
                className="wishlist-icon"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.product_id);
                }}
            >
                {wishlist.includes(product.product_id) ? (
                    <AiFillHeart className="wishlist-heart filled" />
                ) : (
                    <AiOutlineHeart className="wishlist-heart" />
                )}
            </div>


            <div className="product-image-wrapper">
                <img
                    src={product.product_image_url}
                    alt={product.product_name}
                    className="customer-discount-product-image"
                />
            </div>
            <div className="customer-product-name customer-discount-section-name">
                {product.product_name}
            </div>
            <div className="customer-discount-section-price">
                ₹{parseFloat(product.final_price).toFixed(2)} (incl. GST)
            </div>

            <div>
                <div className="customer-discount-section-original-price">
                    ₹{parseFloat(product.price).toFixed(2)} (incl. GST)
                    <div className="discount-tag">
                        {product.discount && `${product.discount} off`}
                    </div>
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
                        {product.availability === "Out of Stock"
                            ? "Out of Stock"
                            : product.availability === "Very Few Products Left"
                                ? "Few Left"
                                : "In Stock"}
                    </span>
                    {(product.availability === "Very Few Products Left" || product.availability === "In Stock") && (
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
    );

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
        <div className="customer-dashboard container discount-dashboard">
            {error && <p>{error}</p>}

            {!error && (
                <div className="customer-products">
                    <div className="customer-products-heading">Discounted Products</div>
                    <div className="popup-discount">
                        {showPopup && (
                            <PopupMessage
                                message={popupMessage.text}
                                type={popupMessage.type}
                                onClose={() => setShowPopup(false)}
                            />
                        )}
                    </div>
                    {discountedProducts.length > 0 ? (
                        discountedProducts.length === 1 ? (
                            <div className="single-discount-product-wrapper">
                                {renderProductCard(discountedProducts[0])}
                            </div>
                        ) : (
                            <Slider {...sliderSettings}>
                                {discountedProducts.map((product) => renderProductCard(product))}
                            </Slider>
                        )
                    ) : (
                        <p className="no-discount-products">No Discounted Products Available</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewDiscountedProducts;
