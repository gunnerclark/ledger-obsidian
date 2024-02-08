import {
  makeBalanceData,
  makeDailyAccountBalanceChangeMap,
  makeDeltaData,
  makePercentData,
  removeDuplicateAccounts,
} from '../balance-utils';
import { Interval, makeBucketNames } from '../date-utils';
import {
  IBarChartOptions,
  ILineChartOptions,
  IPieChartOptions,
} from 'chartist';
import { Moment } from 'moment';
import React from 'react';
import ChartistGraph from 'react-chartist';
import styled from 'styled-components';

const ChartHeader = styled.div`
  display: flex;
`;

const Legend = styled.div`
  margin-left: auto;
  flex-shrink: 1;
`;

const ChartTypeSelector = styled.div`
  flex-shrink: 1;
  flex-grow: 0;
`;

const Chart = styled.div`
  .ct-label {
    color: var(--text-muted);
  }
`;

export const AccountVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  selectedAccounts: string[];
  startDate: Moment;
  endDate: Moment;
  interval: Interval;
}> = (props): JSX.Element => {
  // TODO: Set the default mode based on the type of account selected
  const [mode, setMode] = React.useState('balance');

  console.log(props.dailyAccountBalanceMap);

  const filteredAccounts = removeDuplicateAccounts(props.selectedAccounts);
  const dateBuckets = makeBucketNames(
    props.interval,
    props.startDate,
    props.endDate,
  );

  //   const visualization =
  //     mode === 'balance' ? (
  //       <BalanceVisualization
  //         dailyAccountBalanceMap={props.dailyAccountBalanceMap}
  //         allAccounts={props.allAccounts}
  //         accounts={filteredAccounts}
  //         dateBuckets={dateBuckets}
  //       />
  //     ) : (
  //       <DeltaVisualization
  //         dailyAccountBalanceMap={props.dailyAccountBalanceMap}
  //         allAccounts={props.allAccounts}
  //         accounts={filteredAccounts}
  //         dateBuckets={dateBuckets}
  //         startDate={props.startDate}
  //         interval={props.interval}
  //       />
  //     );
  let visualization;
  if (mode === 'balance') {
    visualization = (
      <BalanceVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
      />
    );
  } else if (mode === 'pnl') {
    visualization = (
      <DeltaVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
        startDate={props.startDate}
        interval={props.interval}
      />
    );
  } else if (mode === 'percent') {
    visualization = (
      <PercentVisualization
        dailyAccountBalanceMap={props.dailyAccountBalanceMap}
        allAccounts={props.allAccounts}
        accounts={filteredAccounts}
        dateBuckets={dateBuckets}
        startDate={props.startDate}
        interval={props.interval}
      />
    );
  }

  return (
    <>
      <ChartHeader>
        <ChartTypeSelector>
          <select
            className="dropdown"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
            }}
          >
            <option value="balance">Account Balance</option>
            <option value="pnl">Profit and Loss</option>
            <option value="percent">Pie Chart</option>
          </select>
        </ChartTypeSelector>
        <Legend>
          <ul className="ct-legend">
            {filteredAccounts.map((account, i) => (
              <li key={account} className={`ct-series-${i}`}>
                {account}
              </li>
            ))}
          </ul>
        </Legend>
      </ChartHeader>
      <Chart>{visualization}</Chart>
    </>
  );
};

const BalanceVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
}> = (props): JSX.Element => {
  const data = {
    labels: props.dateBuckets,
    series: props.accounts.map((account) =>
      makeBalanceData(
        props.dailyAccountBalanceMap,
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  const options: ILineChartOptions = {
    height: '300px',
    width: '100%',
    showArea: false,
    showPoint: true,
  };

  return <ChartistGraph data={data} options={options} type="Line" />;
};

const DeltaVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
  startDate: Moment;
  interval: Interval;
}> = (props): JSX.Element => {
  const data = {
    labels: props.dateBuckets,
    series: props.accounts.map((account) =>
      makeDeltaData(
        props.dailyAccountBalanceMap,
        props.startDate
          .clone()
          .subtract(1, props.interval)
          .format('YYYY-MM-DD'),
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  const options: IBarChartOptions = {
    height: '300px',
    width: '100%',
  };

  return <ChartistGraph data={data} options={options} type="Bar" />;
};

const PercentVisualization: React.FC<{
  dailyAccountBalanceMap: Map<string, Map<string, number>>;
  allAccounts: string[];
  accounts: string[];
  dateBuckets: string[];
  startDate: Moment;
  interval: Interval;
}> = (props): JSX.Element => {
  if (
    props.accounts.filter((x) => x.startsWith('Income')).length === 0 &&
    props.accounts.filter((x) => x.startsWith('Expenses')).length > 0
  ) {
    props.accounts.push('Income');
  } else if (
    props.accounts.filter((x) => x.startsWith('Assets')).length === 0 &&
    props.accounts.filter((x) => x.startsWith('Liabilities')).length > 0
  ) {
    props.accounts.push('Assets');
  } else {
    // default to assets if empty
    // props.accounts.push('Assets');
  }
  const data = {
    // labels: props.dateBuckets,
    series: props.accounts.map((account) =>
      makePercentData(
        props.dailyAccountBalanceMap,
        props.startDate
          .clone()
          .subtract(1, props.interval)
          .format('YYYY-MM-DD'),
        props.dateBuckets,
        account,
        props.allAccounts,
      ),
    ),
  };

  /*
	- View expenses from income
		- force selection of total income unless subset it selected
	- View liabilities from assets
		- force selection of total assets unless subset it selected

  	If Liabilities are selected, and no assets are selected, select the assets category
	If Expenses are selected, and no income is selected, select the income category

	!TODO: Accommodate for children accounts in pie chart. Redo calculationsm. Append to balanceRatio array instead of in/out balance variables.

	!TODO: Ignore Expenses and Liabilities categories when subsets are selected.

  */

  const balanceRatio: { labels: string[]; series: number[] } = {
    labels: [],
    series: [],
  };
  let outBalance: number = 0;
  let inBalance: number = 0;

  data.series.forEach((account) => {
    if (account.filter((x) => x.account.startsWith('Income')).length > 0) {
      // Select Income category
      inBalance = Math.abs(
        account
          .map((x) => x.balance)
          .reduce((paritalSum, a) => paritalSum + a, 0),
      );
      //   balanceRatio.series.push(inBalance - outBalance);
    } else if (
      account.filter((x) => x.account.startsWith('Assets')).length > 0
    ) {
      // Select Asset category
      inBalance = Math.abs(
        account
          .map((x) => x.balance)
          .reduce((paritalSum, a) => paritalSum + a, 0),
      );
      //   balanceRatio.series.push(inBalance - outBalance);
    } else if (
      account.filter((x) => x.account.startsWith('Expenses')).length > 0
    ) {
      // toggle Income category
      // [Income - Expenses, Espenses]
      const expense = Math.abs(
        account
          .map((x) => x.balance)
          .reduce((paritalSum, a) => paritalSum + a, 0),
      );
      // if balanceRatio series already contains an expense value, check if it has a subcategory and if it does add, otherwise remove it and add this one.
      balanceRatio.series.push(expense);
      balanceRatio.labels.push(((expense / inBalance) * 100).toFixed(2) + '%');
      outBalance += expense;
    } else if (
      account.filter((x) => x.account.startsWith('Liabilities')).length > 0
    ) {
      // toggle Assets category
      // [Assets - Liabilities, Liabilities]
      const liability = Math.abs(
        account
          .map((x) => x.balance)
          .reduce((paritalSum, a) => paritalSum + a, 0),
      );
      balanceRatio.series.push(liability);
      balanceRatio.labels.push(
        ((liability / inBalance) * 100).toFixed(2) + '%',
      );
      outBalance += liability;
    }
  });
  //   balanceRatio.labels.push(((outBalance / inBalance) * 100).toFixed(2) + '%');
  balanceRatio.series.push(inBalance - outBalance);
  balanceRatio.labels.push(
    (((inBalance - outBalance) / inBalance) * 100).toFixed(2) + '%',
  );

  const options: IPieChartOptions = {
    height: '300px',
    width: '100%',
  };

  return <ChartistGraph data={balanceRatio} options={options} type="Pie" />;
};
