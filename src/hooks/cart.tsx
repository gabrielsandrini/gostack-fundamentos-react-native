import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // To clear the cart, discomment next line and reload the App:
      // await AsyncStorage.removeItem('@GoMarketplace:cart');

      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const persistOnLocalStorage = useCallback(async productsToStore => {
    await AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(productsToStore),
    );
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(state => {
        const auxiliar = state;

        const index = state.findIndex(item => item.id === id);

        auxiliar[index].quantity += 1;

        persistOnLocalStorage(auxiliar);

        return [...auxiliar];
      });
    },
    [persistOnLocalStorage],
  );

  const decrement = useCallback(
    async id => {
      setProducts(state => {
        const auxiliar = state;

        const index = state.findIndex(item => item.id === id);

        if (auxiliar[index].quantity > 1) {
          auxiliar[index].quantity -= 1;
        }

        persistOnLocalStorage(auxiliar);

        return [...auxiliar];
      });
    },
    [persistOnLocalStorage],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productAlreadyAdded = products.some(item => item.id === product.id);

      if (productAlreadyAdded) {
        increment(product.id);
      } else {
        const newState = [...products, { ...product, quantity: 1 }];
        persistOnLocalStorage(newState);
        setProducts(newState);
      }
    },
    [increment, persistOnLocalStorage, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
