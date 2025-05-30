import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { Timestamp, Firestore, doc, getDoc, collection, getDocs, writeBatch, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-archive-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './archive-detail.component.html',
  styleUrls: ['./archive-detail.component.css']
})
export class ArchiveDetailComponent implements OnInit {
  project: Project | null = null;
  archivedIssues: any[] = [];
  archivedTodos: { [issueId: string]: any[] } = {};
  archiveProjectMembers: { uid: string; displayName: string; email: string }[] = [];
  creatorName: string = '';
  archiveComments: any[] = [];
  archiveCommentAuthors: { [uid: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadAllArchiveData(projectId);
    }
  }

  private async loadAllArchiveData(projectId: string) {
    try {
      // プロジェクト本体
      this.project = await this.projectService.getArchivedProject(projectId);

      // 作成者名を取得
      if (this.project?.createdBy) {
        const userRef = doc(this.firestore, 'users', this.project.createdBy);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          this.creatorName = userSnap.data()['displayName'] || 'Unknown User';
        }
      }

      // メンバー詳細を取得
      if (this.project?.members) {
        const memberPromises = this.project.members.map(async (uid: string) => {
          const userDoc = doc(this.firestore, 'users', uid);
          const userSnap = await getDoc(userDoc);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
              uid,
              displayName: userData['displayName'] || 'Unknown User',
              email: userData['email'] || ''
            };
          }
          return null;
        });
        const members = (await Promise.all(memberPromises)).filter((m): m is NonNullable<typeof m> => m !== null);
        this.archiveProjectMembers = members;
      }

      // 課題一覧
      const issuesRef = collection(this.firestore, 'archives', projectId, 'issues');
      const issuesSnap = await getDocs(issuesRef);
      this.archivedIssues = issuesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 各課題のToDo一覧
      for (const issue of this.archivedIssues) {
        const todosRef = collection(this.firestore, 'archives', projectId, 'issues', issue.id, 'todos');
        const todosSnap = await getDocs(todosRef);
        this.archivedTodos = { ...this.archivedTodos, [issue.id]: todosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
        this.cdr.detectChanges();
      }
      // コメント一覧
      const commentsRef = collection(this.firestore, 'archives', projectId, 'comments');
      const commentsSnap = await getDocs(commentsRef);
      this.archiveComments = [];
      const uids = new Set<string>();
      for (const docSnap of commentsSnap.docs) {
        const comment = { id: docSnap.id, ...docSnap.data(), replies: [] as any[] } as any;
        // repliesサブコレクション取得
        const repliesRef = collection(this.firestore, 'archives', projectId, 'comments', comment.id, 'replies');
        const repliesSnap = await getDocs(repliesRef);
        comment.replies = repliesSnap.docs.map(r => ({ id: r.id, ...r.data() }));
        this.archiveComments.push(comment);
        if (comment.author?.uid) uids.add(comment.author.uid);
        for (const reply of comment.replies) {
          if (reply.user?.uid) uids.add(reply.user.uid);
        }
      }
      for (const uid of uids) {
        const userRef = doc(this.firestore, 'users', uid);
        const userSnap = await getDoc(userRef);
        this.archiveCommentAuthors[uid] = userSnap.exists() ? (userSnap.data()['displayName'] || '不明') : '不明';
      }
    } catch (error) {
      console.error('Error loading archive data:', error);
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '日付なし';
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '日付なし';
    }
    return new DatePipe('ja-JP').transform(date, 'yyyy/MM/dd') || '日付なし';
  }

  formatDateTime(timestamp: any): string {
    if (!timestamp) return '日付なし';
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '日付なし';
    }
    return new DatePipe('ja-JP').transform(date, 'yyyy/MM/dd HH:mm') || '日付なし';
  }

  isMemberObject(member: any): boolean {
    return member && typeof member === 'object' && 'displayName' in member;
  }

  get nonCreatorArchiveMembers() {
    return this.archiveProjectMembers.filter(m => m.uid !== this.project?.createdBy);
  }

  get archivedIssuesNotStarted() {
    return this.archivedIssues.filter(issue => issue.status === '未着手');
  }
  get archivedIssuesInProgress() {
    return this.archivedIssues.filter(issue => issue.status === '進行中');
  }
  get archivedIssuesOnHold() {
    return this.archivedIssues.filter(issue => issue.status === '保留');
  }
  get archivedIssuesDone() {
    return this.archivedIssues.filter(issue => issue.status === '完了');
  }

  getMemberDisplayName(uid: string): string {
    if (!uid) return '';
    const member = this.archiveProjectMembers.find(m => m.uid === uid);
    return member ? member.displayName : '';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return classes[priority] || '';
  }

  goToArchiveList() {
    this.router.navigate(['/archive']);
  }

  goToArchiveIssue() {
    this.router.navigate(['/archive-issue']);
  }

  getTodosForIssue(issueId: string) {
    return this.archivedTodos[issueId] || [];
  }

  trackByTodoId(index: number, todo: any) {
    return todo.id;
  }

  formatArchiveCommentDate(ts: any): string {
    if (!ts) return '';
    return new DatePipe('ja-JP').transform(ts.toDate(), 'yyyy/MM/dd HH:mm') || '';
  }
  getArchiveCommentAuthor(uid: string): string {
    return this.archiveCommentAuthors[uid] || '不明';
  }

  async restoreProjectWithCommentsAndReplies() {
    if (!this.project?.id) return;
    const projectId = this.project.id;
    try {
      // 1. まずarchives/{projectId}から本体データを取得し、projects/{projectId}本体を作成
      const archiveProjectRef = doc(this.firestore, 'archives', projectId);
      const archiveProjectSnap = await getDoc(archiveProjectRef);
      if (!archiveProjectSnap.exists()) {
        alert('アーカイブプロジェクトが見つかりません');
        return;
      }
      const projectData = archiveProjectSnap.data();
      await setDoc(doc(this.firestore, 'projects', projectId), projectData);

      // 2. commentsとrepliesをprojects配下にコピー＆アーカイブ側を削除
      const commentsRef = collection(this.firestore, 'archives', projectId, 'comments');
      const commentsSnap = await getDocs(commentsRef);
      const batch = writeBatch(this.firestore);

      for (const commentDoc of commentsSnap.docs) {
        const commentData = commentDoc.data();
        const commentId = commentDoc.id;
        // 復元先にコメントをコピー
        const restoreCommentRef = doc(this.firestore, 'projects', projectId, 'comments', commentId);
        batch.set(restoreCommentRef, commentData);

        // replies取得
        const repliesRef = collection(this.firestore, 'archives', projectId, 'comments', commentId, 'replies');
        const repliesSnap = await getDocs(repliesRef);
        for (const replyDoc of repliesSnap.docs) {
          const replyData = replyDoc.data();
          const replyId = replyDoc.id;
          // 復元先にリプライをコピー
          const restoreReplyRef = doc(this.firestore, 'projects', projectId, 'comments', commentId, 'replies', replyId);
          batch.set(restoreReplyRef, replyData);
          // アーカイブ側のリプライを削除
          batch.delete(replyDoc.ref);
        }
        // アーカイブ側のコメントを削除
        batch.delete(commentDoc.ref);
      }
      await batch.commit();

      alert('プロジェクト・コメント・リプライの復元が完了しました');
    } catch (error) {
      console.error('Error restoring project, comments and replies:', error);
      alert('復元に失敗しました');
    }
  }
}
