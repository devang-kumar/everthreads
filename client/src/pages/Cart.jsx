import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { fmt } from '../utils/format'
import './Cart.css'

export default function Cart() {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart()
  const shipping = cartTotal >= 999 ? 0 : 99

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Bag</h1>
        {cart.length === 0 ? (
          <div className="cart-empty-page">
            <i className="fa fa-shopping-bag" />
            <h3>Your bag is empty</h3>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cart.map(item => (
                <div key={`${item.productId}-${item.size}`} className="cart-row">
                  <div className="cart-row-img">
                    {item.img ? <img src={item.img} alt={item.name} /> : <i className="fa fa-tshirt" />}
                  </div>
                  <div className="cart-row-info">
                    <h3>{item.name}</h3>
                    <p>Size: {item.size}</p>
                    <div className="cart-row-actions">
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.productId, item.size, item.qty - 1)}>−</button>
                        <span className="qty-num">{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.productId, item.size, item.qty + 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.productId, item.size)}>
                        <i className="fa fa-trash" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-row-price">{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? <span className="free">FREE</span> : fmt(shipping)}</span></div>
              {shipping > 0 && <p className="free-ship-note">Add {fmt(999 - cartTotal)} more for free shipping</p>}
              <div className="summary-row total"><span>Total</span><span>{fmt(cartTotal + shipping)}</span></div>
              <Link to="/checkout" className="btn-primary full-width">Proceed to Checkout</Link>
              <Link to="/shop" className="continue-shopping">← Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
