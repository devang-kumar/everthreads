import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { fmt } from '../../utils/format'
import './CartSidebar.css'

export default function CartSidebar() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQty, cartTotal } = useCart()

  return (
    <>
      <div className={`cart-sidebar${isOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h3>Your Bag <span>({cart.length})</span></h3>
          <button onClick={() => setIsOpen(false)} aria-label="Close cart"><i className="fa fa-times" /></button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <i className="fa fa-shopping-bag" />
              <p>Your bag is empty</p>
              <Link to="/shop" className="btn-primary" onClick={() => setIsOpen(false)}>Start Shopping</Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.productId}-${item.size}`} className="cart-item">
                <div className="cart-item-img">
                  {item.img
                    ? <img src={item.img} alt={item.name} />
                    : <i className="fa fa-tshirt" />
                  }
                </div>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>Size: {item.size}</p>
                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.size, item.qty - 1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.size, item.qty + 1)}>+</button>
                    </div>
                    <span className="cart-item-price">{fmt(item.price * item.qty)}</span>
                  </div>
                  <span className="cart-item-remove" onClick={() => removeFromCart(item.productId, item.size)}>Remove</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row total">
              <span>Subtotal</span>
              <span>{fmt(cartTotal)}</span>
            </div>
            <Link to="/checkout" className="btn-primary full-width" onClick={() => setIsOpen(false)}>
              Proceed to Checkout
            </Link>
            <p className="cart-secure"><i className="fa fa-lock" /> Secure checkout</p>
          </div>
        )}
      </div>
      {isOpen && <div className="cart-overlay open" onClick={() => setIsOpen(false)} />}
    </>
  )
}
