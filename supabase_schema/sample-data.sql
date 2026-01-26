-- 假设存在一些用户，这里我们不创建用户，因为auth.users表由Supabase管理
-- 为了示例数据，你需要替换 'your-user-id-1' 和 'your-user-id-2' 为实际的 auth.users 中的用户ID

INSERT INTO public.collected_articles (user_id, arxiv_id, title, authors, summary, pdf_url)
VALUES
  (
    'your-user-id-1', -- 替换为实际的用户ID
    '2301.00001',
    'Sample Article 1: A Deep Dive into AI',
    '[{"name": "John Doe"}, {"name": "Jane Smith"}]',
    '这是一个关于人工智能最新进展的示例摘要。',
    'https://arxiv.org/pdf/2301.00001.pdf'
  ),
  (
    'your-user-id-1', -- 替换为实际的用户ID
    '2301.00002',
    'Sample Article 2: Quantum Computing Basics',
    '[{"name": "Alice Wonderland"}]',
    '这篇是关于量子计算基础知识的概述。',
    'https://arxiv.org/pdf/2301.00002.pdf'
  ),
  (
    'your-user-id-2', -- 替换为实际的用户ID
    '2301.00003',
    'Sample Article 3: Blockchain Technology Explained',
    '[{"name": "Bob The Builder"}, {"name": "Charlie Chaplin"}]',
    '本文解释了区块链技术的核心概念和应用。',
    'https://arxiv.org/pdf/2301.00003.pdf'
  );
