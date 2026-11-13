import React from 'react';
import { WorkforceScreen } from '../screens/farm/workforce/WorkforceScreen';
import { AddWorkerScreen } from '../screens/farm/workforce/AddWorkerScreen';
import { WorkerDetailScreen } from '../screens/farm/workforce/WorkerDetailScreen';
import { PayrollScreen } from '../screens/farm/workforce/PayrollScreen';
import { DailyAttendanceScreen } from '../screens/farm/workforce/DailyAttendanceScreen';
import { readRouteParams } from './routeParams';
import type { FarmerRouteRenderer } from './types';

/** Workforce: workers, a worker's detail, add / edit worker, payroll and daily attendance. */
export const renderWorkforceRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack }) => {
  switch (screen) {
    case 'Workforce':
      return (
        <WorkforceScreen
          onBack={goBack}
          onNavigateToAddWorker={(fid) => navigate('AddWorker', { farmId: fid })}
          onNavigateToTimesheet={() => navigate('DailyAttendance')}
          onNavigateToPayroll={() => navigate('Payroll')}
          onNavigateToWorkerDetail={(id, name, role) =>
            navigate('WorkerDetail', { workerId: id, workerName: name, workerRole: role })
          }
        />
      );
    case 'Payroll':
      return (
        <PayrollScreen
          onBack={goBack}
          onNavigateToWorkerDetail={(id, name) =>
            navigate('WorkerDetail', { workerId: id, workerName: name })
          }
        />
      );
    case 'WorkerDetail':
      return (
        <WorkerDetailScreen
          workerId={typeof params['workerId'] === 'string' ? params['workerId'] : 'w1'}
          workerName={typeof params['workerName'] === 'string' ? params['workerName'] : 'Murugan R.'}
          workerRole={
            typeof params['workerRole'] === 'string'
              ? params['workerRole']
              : 'Field Worker · Daily wage'
          }
          onBack={goBack}
          onNavigateToEditWorker={(workerData) => navigate('AddWorker', workerData || {})}
        />
      );
    case 'AddWorker':
      return (
        <AddWorkerScreen
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          initialWorker={readRouteParams('AddWorker', params)}
          onBack={goBack}
          onCancel={goBack}
          onSave={() => goBack()}
        />
      );
    case 'DailyAttendance':
      return <DailyAttendanceScreen onNavigateBack={goBack} />;
    default:
      return undefined;
  }
};
