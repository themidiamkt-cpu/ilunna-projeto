-- O gatilho de custo recalcula o preco quando a ficha do kit muda.
-- Reaplica ao final o valor comercial definido para os quatro kits.
UPDATE public.produtos
SET preco_venda=129.58, updated_at=now()
WHERE sku IN (
  'KIT-FASE-LUA-NOVA',
  'KIT-FASE-LUA-CRESCENTE',
  'KIT-FASE-LUA-CHEIA',
  'KIT-FASE-LUA-MINGUANTE'
);
