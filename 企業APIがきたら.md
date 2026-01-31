  # 企業検索オートコンプリート機能の実装計画                        
                                                                    
  ## 概要                                                           
  AddCompanyModalの企業名入力を、オートコンプリート検索に置き換     
  える。国税庁法人番号APIを使い、企業名を入力すると候補が表示さ     
  れ、選択すると企業情報が自動入力される。                          
                                                                    
  ## フェーズ1: 企業名オートコンプリート検索                        
                                                                    
  ### 1-1. 国税庁法人番号APIとの連携                                
  - **ファイル**:                                                   
  `packages/shared/src/services/companySearchService.ts` (新規)     
  - 国税庁法人番号API（https://www.houjin-bangou.nta.go.jp/weba     
  pi/）を呼び出す                                                   
  - エンドポイント:   
  `https://api.houjin-bangou.nta.go.jp/4/name?...`                  
  - 企業名で前方一致検索、結果をパースして返す                      
  - debounce処理（300ms）で過剰なAPI呼び出しを防止                  
  - **注意**:                                                       
  APIキー（アプリケーションID）の取得が必要（無料登録）             
                                                                    
  ### 1-2. AddCompanyModalのUI改修                                  
  - **ファイル**: `src/components/AddCompanyModal.tsx`              
  - 企業名テキスト入力をオートコンプリート付きコンポーネントに      
  変更                                                              
  - 入力に応じて候補リストをドロップダウン表示                      
  - 各候補には企業名を表示                                          
  - 候補選択時に企業名フィールドを自動入力                          
  - 候補が見つからない場合は手入力も引き続き可能（フォールバッ      
  ク）                                                              
                                                                    
  ### 1-3. 検索結果の型定義                                         
  - **ファイル**: `packages/shared/src/types/companySearch.ts`      
  (新規)                                                            
  ```typescript                                                     
  interface CompanySearchResult {                                   
  corporateNumber: string;  // 法人番号                             
  name: string;             // 企業名                               
  address?: string;         // 所在地（補助情報として表示）         
  }                                                                 
  ```                                                               
                                                                    
  ## フェーズ2: 企業ロゴ/アイコン表示                               
                                                                    
  ### 2-1. Google Favicon APIでロゴ取得                             
  - 国税庁APIにはドメイン情報がないため、以下のアプローチ:          
  - Supabaseに `company_domains` テーブルを作成（法人番号 →         
  ドメインのマッピング）                                            
  -                                                                 
  初期データとして就活で人気の企業（数百社）のドメインを登録        
  - ドメインが判明している企業のみ                                  
  `https://www.google.com/s2/favicons?domain=DOMAIN&sz=32`          
  でロゴを表示                                                      
  - ドメイン不明の企業は現在のイニシャルアバターを継続使用          
                                                                    
  ### 2-2. KanbanCard・検索候補にロゴ反映                           
  - **ファイル**: `src/components/KanbanCard.tsx`,                  
  `AddCompanyModal.tsx`                                             
  - 企業にドメイン情報がある場合はfaviconを表示                     
  - ない場合は既存のカラーイニシャルアバターをフォールバック        
                                                                    
  ## フェーズ3: マイページURL自動入力                               
                                                                    
  ### 3-1. company_domainsテーブルにlogin_urlカラム追加             
  - 人気企業の採用マイページURLも `company_domains`                 
  テーブルに格納                                                    
  -                                                                 
  企業選択時にlogin_urlが存在すれば、マイページURL欄に自動入力      
                                                                    
  ## 実装順序                                                       
  1. **まず**: フェーズ1（検索オートコンプリート） —                
  最もインパクトが大きい                                            
  2. **次に**: フェーズ2（ロゴ表示） —                              
  company_domainsテーブル構築が必要                                 
  3. **最後に**: フェーズ3（マイページURL自動入力） —               
  フェーズ2のテーブルを拡張                                         
                                                                    
  ## 修正対象ファイル                                               
  | ファイル | 変更内容 |                                           
  |---------|---------|                                             
  | `packages/shared/src/services/companySearchService.ts` |        
  新規: 法人番号API呼び出し |                                       
  | `packages/shared/src/types/companySearch.ts` | 新規:            
  検索結果型定義 |                                                  
  | `src/components/AddCompanyModal.tsx` |                          
  オートコンプリートUI実装 |                                        
  | `src/components/KanbanCard.tsx` | ロゴ表示対応（フェーズ2）     
  |                                                                 
  | `packages/shared/src/types/database.ts` |                       
  company_domainsテーブル型追加（フェーズ2） |                      
                                                                    
  ## 前提条件                                                       
  - 国税庁法人番号APIのアプリケーションIDを取得する必要あり（ht     
  tps://www.houjin-bangou.nta.go.jp/webapi/ から無料申請）          
  - CORSの問題がある場合、Supabase Edge                             
  Functionをプロキシとして使う可能性あり                            
                                                                    
  ## 検証方法                                                       
  1. AddCompanyModalを開き、企業名を入力して候補が表示されるこ      
  とを確認                                                          
  2. 候補を選択して企業名が自動入力されることを確認                 
  3. 候補にない企業名でも手入力で追加できることを確認               
  4. APIエラー時にフォールバック（手入力）が機能することを確認      
                                                               