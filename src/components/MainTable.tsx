import React, { useEffect, useState } from "react";
import papa from "papaparse";
import { Spin, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { LineChart } from "@mui/x-charts";

// interfaces for the data
interface SalaryData {
  work_year: number;
  salary_in_usd: number;
  job_title: string;
}

interface YearData {
  year: number;
  totalJobs: number;
  avgSalary: number;
  jobTitles: Record<string, number>;
}

// columns for the main table
const columns: ColumnsType<YearData> = [
  {
    title: "Year",
    dataIndex: "year",
    key: "year",
    sorter: (a: YearData, b: YearData) => a.year - b.year,
  },
  {
    title: "Total Jobs",
    dataIndex: "totalJobs",
    key: "totalJobs",
    sorter: (a: YearData, b: YearData) => a.totalJobs - b.totalJobs,
  },
  {
    title: "Average Salary(USD)",
    dataIndex: "avgSalary",
    key: "avgSalary",
    sorter: (a: YearData, b: YearData) => a.avgSalary - b.avgSalary,
    render: (value: number) => `$${value.toFixed(2)}`,
  },
];

// columns for the job titles table
const jobTitlesColumns: ColumnsType<{ jobTitle: string; jobCount: number }> = [
  {
    title: "Job Title",
    dataIndex: "jobTitle",
    key: "jobTitle",
  },
  {
    title: "Job Count",
    dataIndex: "jobCount",
    key: "jobCount",
    sorter: (a, b) => a.jobCount - b.jobCount,
  },
];

// Main component
const MainTable: React.FC = () => {
  const [data, setData] = useState<YearData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lineData, setLineData] = useState<number[]>([]);
  const [xLabels, setXLabels] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // fetch and parse the CSV data
  useEffect(() => {
    papa.parse<SalaryData>("/data/salaries.csv", {
      download: true,
      header: true,
      complete: (result) => {
        // Calculate the average salary and filter out invalid data
        const parsedData = result.data as SalaryData[];
        const yearDataMap: Record<number, YearData> = {};

        parsedData.forEach((row) => {
          const year = row.work_year;
          const salaryInUsd = Number(row.salary_in_usd);
          const jobTitle = row.job_title;

          if (!yearDataMap[year]) {
            yearDataMap[year] = {
              year,
              totalJobs: 0,
              avgSalary: 0,
              jobTitles: {},
            };
          }

          yearDataMap[year].totalJobs++;
          yearDataMap[year].avgSalary += salaryInUsd;

          if (!yearDataMap[year].jobTitles[jobTitle]) {
            yearDataMap[year].jobTitles[jobTitle] = 0;
          }
          yearDataMap[year].jobTitles[jobTitle]++;
        });

        const yearData: YearData[] = Object.values(yearDataMap).map((yd) => ({
          ...yd,
          avgSalary: Math.round(yd.avgSalary / yd.totalJobs),
        }));

        // Update the state variables
        const filteredData = yearData.filter(
          (yd) => yd.totalJobs !== 1 && yd.avgSalary !== 0
        );
        const datawithKeys = filteredData.map((row, index) => ({
          ...row,
          key: index,
        }));
        setData(datawithKeys);

        const lineDataValues = filteredData.map((yd) => yd.totalJobs);
        setLineData(lineDataValues);

        const labels = filteredData.map((yd) => yd.year.toString());
        setXLabels(labels);
      },
      error: (error) => {
        setError("Error parsing CSV file");
        console.error("Error parsing CSV file:", error);
      },
    });
    setLoading(false);
  }, []);

  // Function to handle row click
  const handleRowClick = (record: YearData) => {
    setSelectedYear(record.year);
  };

  // Calculate the job titles data for the selected year
  const jobTitlesData =
    selectedYear !== null
      ? Object.entries(
          data.find((row) => row.year === selectedYear)?.jobTitles || {}
        ).map(([jobTitle, jobCount]) => ({
          jobTitle,
          jobCount,
        }))
      : [];

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {loading && <div className="w-full h-screen flex justify-center items-center"><Spin/></div>}
      <Table
        dataSource={data}
        columns={columns}
        onRow={(record) => ({ onClick: () => handleRowClick(record) })}
        className="cursor-pointer"
      />
      {selectedYear !== null && (
        <div>
          <h2 className="text-xl font-bold mt-4">
            Job Titles for {selectedYear}
          </h2>
          <Table dataSource={jobTitlesData} columns={jobTitlesColumns} />
        </div>
      )}
      <div className="flex w-full items-center justify-center">
        <LineChart
          width={500}
          height={300}
          series={[{ data: lineData, label: "Total Jobs" }]}
          xAxis={[{ scaleType: "point", data: xLabels }]}
        />
      </div>
    </div>
  );
};

export default MainTable;
