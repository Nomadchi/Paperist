"use client"

import React from 'react';
import { PlasmicComponent } from '@plasmicapp/loader-nextjs';
import { PLASMIC } from '@/lib/plasmic'; // 确保路径指向你初始化 PLASMIC 的地方

// 假设你在 Plasmic 里的页面名称或组件名称叫做 "Homepage"
export default function PaparistBoard() {
  // 你可以在这里获取 Supabase 的数据
  // const { data } = useSupabaseQuery...

  return (
      <PlasmicComponent component="Homepage" /> 
  );
}