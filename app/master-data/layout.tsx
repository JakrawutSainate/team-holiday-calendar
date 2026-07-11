'use client';

import React from 'react';
import { MasterDataProvider } from './components/MasterDataContext';

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return <MasterDataProvider>{children}</MasterDataProvider>;
}
