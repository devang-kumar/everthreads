import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem('bc_cart') || '[]') } catch { return [] }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('bc_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, size, qty = 1) => {
    setCart(prev => {
      const key = `${product.productId}-${size}`
      const existing = prev.find(i => `${i.productId}-${i.size}` === key)
      if (existing) {
        return prev.map(i => `${i.productId}-${i.size}` === key ? { ...i, qty: i.qty + qty } : i)
      }
      return [...prev, {
        productId: product.productId,
        _id: product._id,
        name: product.name,
        price: product.price,
        img: product.images?.[0] || '',
        size,
        qty,
        category: product.category
      }]
    })
    setIsOpen(true)
  }

  const removeFromCart = (productId, size) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size)))
  }

  const updateQty = (productId, size, qty) => {
    if (qty < 1) { removeFromCart(productId, size); return }
    setCart(prev => prev.map(i =>
      i.productId === productId && i.size === size ? { ...i, qty } : i
    ))
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ cart, isOpen, setIsOpen, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
