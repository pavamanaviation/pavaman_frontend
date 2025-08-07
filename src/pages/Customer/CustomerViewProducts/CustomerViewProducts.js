import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BiSolidCartAdd } from "react-icons/bi";
import PopupMessage from "../../../components/Popup/Popup";
import { Link } from "react-router-dom";
import { Range } from 'react-range';
import CarouselLanding from "../CustomerCarousel/CustomerCarousel";
import "./CustomerViewProducts.css";
import API_BASE_URL from "../../../config";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { ClipLoader } from "react-spinners";

const CustomerViewProducts = () => {
    const { categoryName, subCategoryName } = useParams();
    const [allProducts, setAllProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const category_id = location.state?.category_id || localStorage.getItem("category_id");
    const sub_category_id = location.state?.sub_category_id || localStorage.getItem("sub_category_id");
    const customer_id = localStorage.getItem("customer_id") || null;
    const category_name = localStorage.getItem("category_name");
    const sub_category_name = localStorage.getItem("sub_category_name");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000);
    const [popupMessage, setPopupMessage] = useState({ text: "", type: "" });
    const [showPopup, setShowPopup] = useState(false);

    const [values, setValues] = useState([0, 10000]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showFilters, setShowFilters] = useState(false);

    const [stockFilter, setStockFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [allCategories, setAllCategories] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [wishlist, setWishlist] = useState([]);


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    const displayPopup = (text, type = "success") => {
        setPopupMessage({ text, type });
        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 5000);
    };

    useEffect(() => {
        fetchFilteredAndSortedProducts();
    }, [sortOrder]);

    useEffect(() => {
        if (subCategoryName) {
            fetchProducts();
        }
    }, [subCategoryName, location.state]);


    useEffect(() => {
        if (categoryName) {
            fetchProducts(categoryName);
        }

        const handleSearch = (e) => {
            const query = e.detail;
            if (!query) {
                fetchProducts(categoryName);
            } else {
                searchProducts(query);
            }
        };
        window.addEventListener("customerCategorySearch", handleSearch);
        return () => window.removeEventListener("customerCategorySearch", handleSearch);
    }, [categoryName]);


    const fetchProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/sort-products-inside-subcategory`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sub_category_id,
                    sub_category_name: subCategoryName,
                    sort_by: sortOrder || "latest",
                    customer_id,
                }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                setAllProducts(data.products);
                setProducts(data.products);
                const minFromAPI = data.product_min_price || 0;
                const maxFromAPI = data.product_max_price || 10000;
                setAllCategories(data.all_categories || []);


                setMinPrice(minFromAPI);
                setMaxPrice(maxFromAPI);
                setValues([minFromAPI, maxFromAPI]);
            }
            else {
                setError(data.error || "Failed to fetch products.");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const searchProducts = async (query) => {
        setLoading(true);
        try {
            const payload = {
                product_name: query?.trim(),
                category_id: category_id || localStorage.getItem("category_id"),
                sub_category_id: sub_category_id || localStorage.getItem("sub_category_id"),
                customer_id: localStorage.getItem("customer_id") || null,
            };


            const response = await fetch(`${API_BASE_URL}/customer-search-products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.status_code === 200 && data.products) {
                setProducts(data.products);
                const initialWishlist = data.products
                    .filter((product) => product.wishlist_status === true)
                    .map((product) => product.product_id);
                setWishlist(initialWishlist);

                setError("");
            } else {
                setProducts([]);
                setError(data.message || "No matching products found.");
            }

        } catch (err) {
            setError("Product search failed.");
        } finally {
            setLoading(false);
        }
    };
    const handleViewProductDetails = (product) => {
        if (!category_id || !sub_category_id) {
            console.error("Missing category_id or sub_category_id");
            return;
        }

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

    const handleAddCart = async (product_id) => {
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to add products to cart.
                </>,
                "error"
            );
            navigate("/customer-login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-cart-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, product_id, quantity: 1 }),
            });

            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup("Product added to cart successfully!", "success");
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                displayPopup(data.error || "Failed to add product to cart.", "error");
            }
        } catch (error) {
            displayPopup("An unexpected error occurred while adding to cart.", "error");
        }
    };
    const fetchFilteredAndSortedProducts = async () => {
        setLoading(true);
        setError(null);

        const hasMin = values[0] !== '';
        const hasMax = values[1] !== '';
        const hasSort = sortOrder !== '';

        let requestBody = {
            category_id: category_id,
            category_name: categoryName,
            sub_category_id: sub_category_id,
            sub_category_name: subCategoryName,
            customer_id: customer_id
        };
        if (hasMin && hasMax && hasSort) {
            requestBody = {
                ...requestBody,
                min_price: values[0],
                max_price: values[1],
                sort_by: sortOrder
            };
        } else if (hasMin && hasMax) {
            requestBody = {
                ...requestBody,
                min_price: values[0],
                max_price: values[1],
                sort_by: 'low_to_high'
            };
        } else if (hasSort) {
            requestBody = {
                ...requestBody,
                sort_by: sortOrder
            };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/filter-and-sort-products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                setProducts(data.products);
                const initialWishlist = data.products
                    .filter((product) => product.wishlist_status === true)
                    .map((product) => product.product_id);
                setWishlist(initialWishlist);
            } else {
                setError(data.error || 'Failed to fetch products');
            }
        } catch (error) {
            setError('An error occurred while fetching products.');
        } finally {
            setLoading(false);
        }
    };
    const toggleCategory = (category_name) => {
        setExpandedCategory((prev) => (prev === category_name ? null : category_name));
    };


    const handleViewProducts = (category, subCategory) => {


        localStorage.setItem("category_id", category.category_id);
        localStorage.setItem("category_name", category.category_name);

        localStorage.setItem("sub_category_id", subCategory.id);
        localStorage.setItem("sub_category_name", subCategory.sub_category_name);

        navigate(`/categories/${category.category_name}/${subCategory.sub_category_name}`, {
            state: {
                category_id: category.category_id,
                sub_category_id: subCategory.sub_category_id,
            },
        });
    };
    useEffect(() => {
        if (products.length > 0) {
            const initialWishlist = products
                .filter((product) => product.wishlist_status === true)
                .map((product) => product.product_id);
            setWishlist(initialWishlist);
        }
    }, [products]);


    const toggleWishlist = async (product_id) => {
        const customer_id = localStorage.getItem("customer_id");
        if (!customer_id) {
            displayPopup(
                <>
                    Please <Link to="/customer-login" className="popup-link">log in</Link> to add to wishlist.
                </>,
                "error"
            );
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/add-to-wishlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id, product_id }),
            });
            const data = await response.json();

            if (data.status_code === 200) {
                displayPopup(data.message, "success");

                setWishlist((prev) =>
                    prev.includes(product_id)
                        ? prev.filter((id) => id !== product_id)
                        : [...prev, product_id]
                );
            } else {
                displayPopup(data.message || "Failed to add to wishlist.", "error");
            }
        } catch (error) {
            displayPopup("An error occurred while adding to wishlist.", "error");
        }
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
        <div className="customer-dashboard container">
            < CarouselLanding />
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <div className="breadcrumb">
                    <span className="breadcrumb-link" onClick={() => navigate("/")}>Home</span>
                    <span className="breadcrumb-separator"> › </span>

                    <span className="breadcrumb-link" onClick={() => navigate("/")}>
                        {categoryName}
                    </span>
                    <span className="breadcrumb-separator"> › </span>

                    <span
                        className="breadcrumb-link"
                        onClick={() =>
                            navigate("/categories/view-sub-categories/", {
                                state: {
                                    category_name: categoryName,
                                    category_id: category_id,
                                },
                            })
                        }
                    >
                        {subCategoryName}
                    </span>

                </div>
            )}
            {!loading && !error && (
                <div className="customer-products">
                    <div className="customer-products-heading">{subCategoryName} - Products</div>
                    <div className="popup-discount">
                        {showPopup && (
                            <PopupMessage
                                message={popupMessage.text}
                                type={popupMessage.type}
                                onClose={() => setShowPopup(false)}
                            />
                        )}
                    </div>
                    <div className="product-filter-dashboard">
                        {isMobile && (
                            <div className="mobile-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                                {showFilters ? "Hide Filters ▲" : "Show Filters ▼"}
                            </div>
                        )}

                        {(!isMobile || showFilters) && (
                            <div className="header-filter">
                                <div className="filter-sort-section">
                                    <div className="filter-heading-products"><p>Filters</p></div>
                                    <div className="price-slider-container">
                                        <label className="price-range-label">
                                            Price Range
                                            <div> ₹{values[0]} - ₹{values[1]}</div>
                                        </label>
                                        <div className="slider-btn">
                                            <Range
                                                className="price-slider-range"
                                                values={values}
                                                step={100}
                                                min={minPrice}
                                                max={maxPrice}
                                                onChange={(newValues) => setValues(newValues)}
                                                renderTrack={({ props, children }) => (
                                                    <div
                                                        {...props}
                                                        style={{
                                                            ...props.style,
                                                            width: '100%',
                                                            background: 'white',
                                                            borderRadius: '4px',
                                                            margin: '20px 0',
                                                            border: '0.5px solid grey',
                                                        }}
                                                    >
                                                        {children}
                                                    </div>
                                                )}
                                                renderThumb={({ props }) => (
                                                    <div
                                                        {...props}
                                                        style={{
                                                            ...props.style,
                                                            height: '15px',
                                                            width: '15px',
                                                            backgroundColor: '#4450A2',
                                                            borderRadius: '50%',
                                                        }}
                                                    />
                                                )}
                                            />
                                            <button className="filter-button" onClick={fetchFilteredAndSortedProducts}>
                                                Filter
                                            </button>
                                        </div>
                                    </div>
                                    <div className="sorting-section">
                                        <label >Sort by: </label>
                                        <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                                            <option value="low_to_high"> Price : Low to High</option>
                                            <option value="high_to_low"> Price : High to Low</option>
                                            <option value="latest"> Latest</option>
                                        </select>
                                    </div>
                                    <div className="category-filter-section">
                                        <div className="sidebar-category-heading">Categories</div>

                                        <div className="sidebar-category-list">
                                            {allCategories.map((category) => (
                                                <div key={category.category_name}>
                                                    <div
                                                        className="sidebar-category-name"
                                                        onClick={() => toggleCategory(category.category_name)}
                                                    >
                                                        <div className="filter-cat-name">{category.category_name}</div>
                                                        <span className="filter-cat-name">
                                                            {expandedCategory === category.category_name ? "▲" : "▼"}
                                                        </span>
                                                    </div>

                                                    {expandedCategory === category.category_name && (
                                                        <div>
                                                            {category.subcategories && category.subcategories.length > 0 ? (
                                                                category.subcategories.map((sub) => (
                                                                    <div
                                                                        key={sub.id}
                                                                        className="filter-subcat-name"
                                                                        onClick={() => handleViewProducts(category, sub)}
                                                                    >
                                                                        {sub.sub_category_name}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="filter-subcat-name">No Subcategories</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>


                                </div>
                            </div>


                        )}
                        <div className="customer-products-section">

                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div
                                        key={product.product_id}
                                        className="customer-product-card product-card-wishlist"
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


                                        <div>
                                            <img
                                                src={
                                                    product.product_images ||
                                                    (Array.isArray(product.product_image_url)
                                                        ? product.product_image_url[0]
                                                        : product.product_image_url)
                                                }

                                                alt={product.product_name}
                                                className="customer-product-image"
                                            />
                                        </div>
                                        <div className="customer-product-name">{product.product_name}</div>
                                        <div className="customer-discount-section-price">₹{product.final_price}.00 (incl. GST)</div>
                                        <div>
                                            <div className="customer-discount-section-original-price">
                                                {product.price !== product.final_price ? (
                                                    <>
                                                        ₹{product.price}.00 (incl. GST)
                                                        <div className="discount-tag">
                                                            {product.discount && parseFloat(product.discount) > 0 ? `${product.discount} off` : ''}
                                                        </div>

                                                    </>

                                                ) : (

                                                    <>&nbsp;</>, <>&nbsp;</>, <>&nbsp;</>, <>&nbsp;</>
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
                                                    {product.availability === "Out of Stock"
                                                        ? "Out of Stock"
                                                        : product.availability === "Very Few Products Left"
                                                            ? "Very Few Products Left"
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
                                ))
                            ) : (
                                <div>

                                    <div>No products available.</div></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerViewProducts;
