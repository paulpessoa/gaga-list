'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TabBar } from './ui/tab-bar';
import { VisionScanner } from './ui/vision-scanner';
import { ScannedProductModal } from './lists/scanned-product-modal';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { MyProductsService } from '@/services/my-products.service';
import { useHaptic } from '@/hooks/use-haptic';

export function NavigationWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const { trigger } = useHaptic();
  const supabase = createClient();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar listId se estiver em uma rota de lista
  const listId = pathname.startsWith('/dashboard/lists/') ? pathname.split('/')[3] : null;

  const handleScanSuccess = (data: any) => {
    setIsScannerOpen(false);
    setScannedData(data);
  };

  const handleSaveToMyProducts = async () => {
    if (!user || !scannedData) return;
    setIsSaving(true);
    try {
      await MyProductsService.addProduct(supabase, {
        user_id: user.id,
        name: scannedData.name,
        brand: scannedData.brand,
        category: scannedData.category,
        metadata: {
          benefits: scannedData.benefits,
          suggested_uses: scannedData.suggested_uses
        } as any
      });
      trigger('success' as any);
      setScannedData(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToList = async () => {
    if (!scannedData || !listId) {
      if (!listId) alert('Abra uma lista primeiro para adicionar o produto.');
      return;
    }
    
    setIsSaving(true);
    try {
      await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scannedData.name,
          category: scannedData.category,
          quantity: "1"
        })
      });
      trigger('success' as any);
      setScannedData(null);
      // O react-query vai invalidar automaticamente se houver listeners, 
      // mas como estamos no wrapper, talvez precise de um refresh ou trigger manual
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar à lista.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lista de rotas onde a TabBar NÃO deve aparecer (ex: login, landing page)
  const hideOnPaths = ['/', '/login', '/api/auth/confirm'];
  const shouldHide = hideOnPaths.includes(pathname);

  if (shouldHide) return null;

  return (
    <>
      <TabBar onScanClick={() => setIsScannerOpen(true)} />
      
      <VisionScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <ScannedProductModal 
        data={scannedData}
        onClose={() => setScannedData(null)}
        onSaveToMyProducts={handleSaveToMyProducts}
        onAddToList={handleAddToList}
        isSaving={isSaving}
      />
    </>
  );
}
