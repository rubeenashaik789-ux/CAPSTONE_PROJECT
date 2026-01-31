import React, { useEffect, useState, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import "./App.css";

/* ================= PRICE LOGIC ================= */

const getCustomPrice = (product) => {
  const base = product.price;
  const category = product.category;

  if (category.includes("clothing")) {
    return 200 + (base % 100); // shirts ₹200–300
  }

  if (category.includes("electronics")) {
    return 20000 + base * 100; // TVs ~₹20k
  }

  if (category.includes("jewelery")) {
    return 5000 + base * 200;
  }

  return 1000 + base * 50;
};

/* ================= CONTEXT ================= */

const CartContext = createContext();
const ThemeContext = createContext();

const useCart = () => useContext(CartContext);
const useTheme = () => useContext(ThemeContext);

/* ================= APP ================= */

export default function App() {
  const [cart, setCart] = useState([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
  }, [dark]);

  const addToCart = (product) => {
    const found = cart.find((i) => i.id === product.id);
    if (found) {
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, qty) => {
    setCart(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <CartContext.Provider
        value={{ cart, addToCart, updateQty, removeFromCart }}
      >
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Router>
      </CartContext.Provider>
    </ThemeContext.Provider>
  );
}

/* ================= NAVBAR ================= */

function Navbar() {
  const { cart } = useCart();
  const { dark, setDark } = useTheme();

  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/cart">Cart ({cart.length})</Link>
      <button onClick={() => setDark(!dark)}>
        {dark ? "Light Mode" : "Dark Mode"}
      </button>
    </nav>
  );
}

/* ================= HOME ================= */

function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
      .then((r) => r.json())
      .then((d) => setProducts(d));
  }, []);

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  let filtered = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (category === "all" ? true : p.category === category));

  if (sort === "low") filtered.sort((a, b) => getCustomPrice(a) - getCustomPrice(b));
  if (sort === "high") filtered.sort((a, b) => getCustomPrice(b) - getCustomPrice(a));

  return (
    <div className="container">
      <h2>Products</h2>

      <div className="controls">
        <input placeholder="Search" onChange={(e) => setSearch(e.target.value)} />
        <select onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort</option>
          <option value="low">Low → High</option>
          <option value="high">High → Low</option>
        </select>
        <select onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <img src={p.image} alt={p.title} />
            <h4>{p.title}</h4>
            <p>₹ {getCustomPrice(p).toFixed(0)}</p>
            <Link to={`/product/${p.id}`}>View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= PRODUCT DETAILS ================= */

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [size, setSize] = useState("");

  useEffect(() => {
    fetch(`https://fakestoreapi.com/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d));
  }, [id]);

  if (!product) return <h3>Loading...</h3>;

  const isClothing = product.category.includes("clothing");

  const handleAdd = () => {
    if (isClothing && !size) {
      alert("Please select a size");
      return;
    }

    addToCart({ ...product, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="container">
      <img src={product.image} alt={product.title} className="detail-img" />
      <h2>{product.title}</h2>
      <p>{product.description}</p>
      <h3>₹ {getCustomPrice(product).toFixed(0)}</h3>

      {isClothing && (
        <select
          className="size-select"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="">Select Size</option>
          <option value="S">Small (S)</option>
          <option value="M">Medium (M)</option>
          <option value="L">Large (L)</option>
          <option value="XL">Extra Large (XL)</option>
        </select>
      )}

      <button
        className={added ? "added-btn" : ""}
        onClick={handleAdd}
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
    </div>
  );
}
/* ================= CART ================= */

function Cart() {
  const { cart, updateQty, removeFromCart } = useCart();

  const total = cart.reduce(
    (s, i) => s + getCustomPrice(i) * i.qty,
    0
  );

  return (
    <div className="container">
      <h2>Cart</h2>

      {cart.map((i) => (
        <div className="cart-item" key={i.id}>
          <span>{i.title}</span>
          <span>₹ {getCustomPrice(i).toFixed(0)}</span>
          <input
            type="number"
            value={i.qty}
            min="1"
            onChange={(e) => updateQty(i.id, +e.target.value)}
          />
          <button onClick={() => removeFromCart(i.id)}>Remove</button>
        </div>
      ))}

      <h3>Total: ₹ {total.toFixed(0)}</h3>
      <Link to="/checkout">Checkout</Link>
    </div>
  );
}

/* ================= CHECKOUT ================= */

function Checkout() {
  const { cart } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [payment, setPayment] = useState("cod");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
  });

  const submitOrder = () => {
    if (!form.name || !form.email || !form.address) {
      alert("Please fill all address details");
      return;
    }

    if (!form.email.includes("@")) {
      alert("Invalid email");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (payment === "upi" && upi.length < 5) {
      alert("Enter valid UPI ID");
      return;
    }

    if (
      payment === "card" &&
      (card.number.length < 12 || !card.expiry || card.cvv.length < 3)
    ) {
      alert("Enter valid card details");
      return;
    }

    alert(
      payment === "cod"
        ? "Order placed successfully (Cash on Delivery)"
        : "Payment successful! Order placed"
    );
  };

  return (
    <div className="container">
      <h2>Checkout</h2>

      <h3>Shipping Details</h3>
      <input
        placeholder="Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <textarea
        placeholder="Address"
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <h3>Payment Method</h3>

      <label>
        <input
          type="radio"
          name="payment"
          value="cod"
          checked={payment === "cod"}
          onChange={(e) => setPayment(e.target.value)}
        />
        Cash on Delivery
      </label>

      <label>
        <input
          type="radio"
          name="payment"
          value="upi"
          onChange={(e) => setPayment(e.target.value)}
        />
        UPI
      </label>

      {payment === "upi" && (
        <input
          placeholder="Enter UPI ID (example@upi)"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
        />
      )}

      <label>
        <input
          type="radio"
          name="payment"
          value="card"
          onChange={(e) => setPayment(e.target.value)}
        />
        Debit / Credit Card
      </label>

      {payment === "card" && (
        <>
          <input
            placeholder="Card Number"
            onChange={(e) =>
              setCard({ ...card, number: e.target.value })
            }
          />
          <input
            placeholder="Expiry (MM/YY)"
            onChange={(e) =>
              setCard({ ...card, expiry: e.target.value })
            }
          />
          <input
            placeholder="CVV"
            onChange={(e) =>
              setCard({ ...card, cvv: e.target.value })
            }
          />
        </>
      )}

      <button onClick={submitOrder}>Pay & Place Order</button>
    </div>
  );
}