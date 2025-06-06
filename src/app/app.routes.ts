import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { DefaultLayoutComponent } from './layouts/default-layout/default-layout.component';
import { ProjectListComponent } from './pages/project/project-list/project-list.component';
import { ProjectCreateComponent } from './pages/project/project-create/project-create.component';
import { SettingComponent } from './pages/setting/setting.component';
import { ProjectDetailComponent } from './pages/project/project-detail/project-detail.component';
import { ArchiveComponent } from './pages/archive/archive/archive.component';
import { IssueCreateComponent } from './pages/issue/issue-create/issue-create.component';
import { IssueDetailComponent } from './pages/issue/issue-detail/issue-detail.component';
import { TodoListComponent } from './pages/todo/todo-list/todo-list.component';
import { ArchiveDetailComponent } from './pages/archive/archive-detail/archive-detail.component';
import { authGuard } from './guards/auth.guard';
import { CalendarComponent } from './pages/calendar/calendar/calendar.component';
import { CalendarDayComponent } from './pages/calendar/calendar-day/calendar-day.component';
import { NotificationComponent } from './pages/notofication/notification.component';
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'projects',
        component: ProjectListComponent
      },
      {
        path: 'projects/create',
        component: ProjectCreateComponent
      },
      {
        path: 'setting',
        component: SettingComponent
      },
      {
        path: 'projects/:id',
        component: ProjectDetailComponent
      },
      {
        path: 'projects/:projectId/issues/create',
        component: IssueCreateComponent
      },
      {
        path: 'projects/:projectId/issues/:issueId',
        component: IssueDetailComponent
      },
      {
        path: 'archive',
        component: ArchiveComponent
      },
      {
        path: 'archives/:id',
        component: ArchiveDetailComponent
      },
      {
        path: 'todo-list',
        component: TodoListComponent
      },
      {
        path: 'calendar',
        component: CalendarComponent
      },
      {
        path: 'calendar/day/:date',
        component: CalendarDayComponent
      },
      {
        path: 'notification',
        component: NotificationComponent
      },
    ]
  }
]; 