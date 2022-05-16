import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      //Criando um novo array para fazer a adição
      const updateCart = [...cart];
      //Checar se o produto existe
      const productExists = updateCart.find((item) => item.id === productId);

      //Verificar se tem estoque
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount; //Quantidade em estoque
      const currentAmount = productExists ? productExists.amount : 0; //Quantidade atual
      const amount = currentAmount + 1; //quantidade desejada

      //A quantiadde desejada não pode ser maior do que o estoque
      if (amount > stockAmount) {
        toast.error("Erro na remoção do produto");
        return;
      }

      if (productExists) {
        //Atualizar a quantidade do carrinho
        productExists.amount = amount;
      } else {
        //Adicionar ao carrinho
        const product = await api.get(`/products/${productId}`);

        //pega os dados da api e cria o campo amount com o valor 1
        const newProduct = {
          ...product.data,
          amount: 1,
        };

        //Adiciona o novo produto no array criado no começo da funçao
        updateCart.push(newProduct);

        //adiciona o novo array no carrinho
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart]; //imutabilidade
      //encontrar o produto para remoçào
      const productIndex = updateCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        //removendo o item do array se foi encontrado
        updateCart.splice(productIndex, 1);

        //setando o carrinho
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      } else {
        //Se ele não encontrar a mensagem do carrinho, exibir mensagem de erro
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      //Se a quantidade do produto for menor ou igual a zero, sair da função
      if (amount <= 0) {
        return;
      }

      //Buscar estoque
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      //verificar se a quantidade desejada tem em estoque 
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      //manipular e atualizar o carrinho 
      const updateCart = [...cart];
      const productExists = updateCart.find(
        (product) => product.id === productId
      );

      //Inserir o produto no carrinho
      if (productExists) {
        productExists.amount = amount;
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
