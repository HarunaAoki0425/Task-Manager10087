import { Timestamp } from '@angular/fire/firestore';

export interface Project {
  id?: string;
  title: string;
  description: string;
  members: string[];  // ユーザーIDの配列
  createdBy: string;  // プロジェクト作成者のUID
  dueDate?: Timestamp;  // プロジェクトの期限
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp;  // アーカイブ日時を追加
  isArchived: boolean;  // プロジェクトがアーカイブされているかどうか
  color?: string;  // プロジェクトのカラー
} 