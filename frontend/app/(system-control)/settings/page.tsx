// app/(system-control)/settings/page.tsx
"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [earlyTolerance, setEarlyTolerance] = useState(-30); // minutes
  const [lateTolerance, setLateTolerance] = useState(15); // minutes
  const [criticalThreshold, setCriticalThreshold] = useState(45); // minutes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSliderChange = (setter: (val: number) => void, value: number) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // TODO: Save to backend
    console.log("Saving configuration:", {
      earlyTolerance,
      lateTolerance,
      criticalThreshold,
    });
    setHasUnsavedChanges(false);
    alert("Configuration saved successfully!");
  };

  const handleDiscard = () => {
    // Reset to default or last saved values
    setEarlyTolerance(-30);
    setLateTolerance(15);
    setCriticalThreshold(45);
    setHasUnsavedChanges(false);
  };

  // Calculate ETA position (0 = ETA exactly)
  const getZoneWidth = (tolerance: number, total: number) => {
    return (Math.abs(tolerance) / total) * 100;
  };

  const totalRange = 120; // -60 to +60 minutes
  const earlyWidth = getZoneWidth(earlyTolerance, totalRange);
  const onTimeWidth = getZoneWidth(lateTolerance - earlyTolerance, totalRange);
  const lateWidth = getZoneWidth(criticalThreshold - lateTolerance, totalRange);

  return (
    <div className='min-h-screen bg-[#0a0e14] p-6'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-white mb-2'>
            System Configuration
          </h1>
          <p className='text-gray-400'>
            Manage global operational parameters for the VOMS dashboard. Adjust
            status thresholds and system behavior.
          </p>
        </div>

        {/* Main Card */}
        <div className='relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl overflow-hidden'>
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'></div>

          {/* Card Header */}
          <div className='p-6 border-b border-white/10'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30'>
                <svg
                  className='w-5 h-5 text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-xl font-bold text-white'>
                  Operational Thresholds
                </h2>
                <p className='text-sm text-gray-400'>
                  Define trip status categorization logic.
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className='p-6 space-y-8'>
            {/* Live Classification Preview */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-white'>
                  Live Classification Preview
                </h3>
                <div className='flex items-center gap-4 text-xs'>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                    <span className='text-gray-400'>EARLY</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='text-gray-400'>ON TIME</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                    <span className='text-gray-400'>LATE</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <span className='text-gray-400'>CRITICAL</span>
                  </div>
                </div>
              </div>

              {/* Timeline Bar */}
              <div className='relative bg-[#0a0e14] rounded-lg p-6 border border-white/10'>
                {/* ETA Marker */}
                <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-10'>
                  <div className='bg-white px-2 py-1 rounded text-xs font-bold text-gray-900'>
                    ETA
                  </div>
                  <div className='w-0.5 h-full bg-white mx-auto'></div>
                </div>

                {/* Color Zones */}
                <div className='flex h-16 rounded-lg overflow-hidden mb-4'>
                  {/* Early Zone */}
                  <div
                    className='bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center relative'
                    style={{ width: `${earlyWidth}%` }}
                  >
                    <span className='text-white text-sm font-semibold'>
                      Early Zone
                    </span>
                  </div>

                  {/* On Time Zone */}
                  <div
                    className='bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center relative'
                    style={{ width: `${onTimeWidth}%` }}
                  >
                    <span className='text-white text-sm font-semibold'>
                      On Time
                    </span>
                  </div>

                  {/* Late Zone */}
                  <div
                    className='bg-gradient-to-r from-yellow-600 to-yellow-500 flex items-center justify-center relative'
                    style={{ width: `${lateWidth}%` }}
                  >
                    <span className='text-white text-sm font-semibold'>
                      Late
                    </span>
                  </div>

                  {/* Critical Zone */}
                  <div className='bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center relative flex-1'>
                    <span className='text-white text-sm font-semibold'>
                      Critical
                    </span>
                  </div>
                </div>

                {/* Timeline Labels */}
                <div className='flex justify-between text-xs text-gray-400'>
                  <span>&lt;∞</span>
                  <span className='text-cyan-400 font-semibold'>
                    {earlyTolerance}m
                  </span>
                  <span className='text-white font-bold'>ETA</span>
                  <span className='text-yellow-400 font-semibold'>
                    +{lateTolerance}m
                  </span>
                  <span className='text-red-400 font-semibold'>
                    +{criticalThreshold}m →
                  </span>
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className='space-y-8'>
              {/* Early Arrival Tolerance */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-base font-semibold text-white'>
                      Early Arrival Tolerance
                    </h3>
                    <p className='text-sm text-gray-400'>
                      Arrivals before this threshold are marked as
                      &quot;Early&quot;.
                    </p>
                  </div>
                  <div className='bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30'>
                    <span className='text-2xl font-bold text-blue-400'>
                      {earlyTolerance} min
                    </span>
                  </div>
                </div>

                <div className='relative'>
                  <input
                    type='range'
                    min='-120'
                    max='0'
                    value={earlyTolerance}
                    onChange={(e) =>
                      handleSliderChange(
                        setEarlyTolerance,
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full h-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-white 
                      [&::-webkit-slider-thumb]:cursor-pointer 
                      [&::-webkit-slider-thumb]:shadow-lg 
                      [&::-webkit-slider-thumb]:border-[3px] 
                      [&::-webkit-slider-thumb]:border-[#0a0e14]
                      [&::-moz-range-thumb]:w-5 
                      [&::-moz-range-thumb]:h-5 
                      [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-white 
                      [&::-moz-range-thumb]:cursor-pointer 
                      [&::-moz-range-thumb]:shadow-lg 
                      [&::-moz-range-thumb]:border-[3px] 
                      [&::-moz-range-thumb]:border-[#0a0e14]
                      hover:[&::-webkit-slider-thumb]:scale-110 
                      hover:[&::-webkit-slider-thumb]:shadow-xl
                      hover:[&::-moz-range-thumb]:scale-110 
                      hover:[&::-moz-range-thumb]:shadow-xl
                      focus:outline-none'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-2'>
                    <span>0m</span>
                    <span>-120m</span>
                  </div>
                </div>
              </div>

              {/* Late Arrival Tolerance */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-base font-semibold text-white'>
                      Late Arrival Tolerance
                    </h3>
                    <p className='text-sm text-gray-400'>
                      Acceptable delay before marking as &quot;Late&quot;.
                    </p>
                  </div>
                  <div className='bg-yellow-500/20 px-4 py-2 rounded-lg border border-yellow-500/30'>
                    <span className='text-2xl font-bold text-yellow-400'>
                      +{lateTolerance} min
                    </span>
                  </div>
                </div>

                <div className='relative'>
                  <input
                    type='range'
                    min='0'
                    max='60'
                    value={lateTolerance}
                    onChange={(e) =>
                      handleSliderChange(
                        setLateTolerance,
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full h-2 bg-gradient-to-r from-green-600 to-yellow-500 rounded-lg appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-white 
                      [&::-webkit-slider-thumb]:cursor-pointer 
                      [&::-webkit-slider-thumb]:shadow-lg 
                      [&::-webkit-slider-thumb]:border-[3px] 
                      [&::-webkit-slider-thumb]:border-[#0a0e14]
                      [&::-moz-range-thumb]:w-5 
                      [&::-moz-range-thumb]:h-5 
                      [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-white 
                      [&::-moz-range-thumb]:cursor-pointer 
                      [&::-moz-range-thumb]:shadow-lg 
                      [&::-moz-range-thumb]:border-[3px] 
                      [&::-moz-range-thumb]:border-[#0a0e14]
                      hover:[&::-webkit-slider-thumb]:scale-110 
                      hover:[&::-webkit-slider-thumb]:shadow-xl
                      hover:[&::-moz-range-thumb]:scale-110 
                      hover:[&::-moz-range-thumb]:shadow-xl
                      focus:outline-none'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-2'>
                    <span>0m</span>
                    <span>+60m</span>
                  </div>
                </div>
              </div>

              {/* Critical Delay Threshold */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-base font-semibold text-white'>
                      Critical Delay Threshold
                    </h3>
                    <p className='text-sm text-gray-400'>
                      Delays exceeding this escalate to &quot;Critical&quot;
                      status.
                    </p>
                  </div>
                  <div className='bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30'>
                    <span className='text-2xl font-bold text-red-400'>
                      +{criticalThreshold} min
                    </span>
                  </div>
                </div>

                <div className='relative'>
                  <input
                    type='range'
                    min='0'
                    max='120'
                    value={criticalThreshold}
                    onChange={(e) =>
                      handleSliderChange(
                        setCriticalThreshold,
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full h-2 bg-gradient-to-r from-yellow-600 to-red-500 rounded-lg appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-white 
                      [&::-webkit-slider-thumb]:cursor-pointer 
                      [&::-webkit-slider-thumb]:shadow-lg 
                      [&::-webkit-slider-thumb]:border-[3px] 
                      [&::-webkit-slider-thumb]:border-[#0a0e14]
                      [&::-moz-range-thumb]:w-5 
                      [&::-moz-range-thumb]:h-5 
                      [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-white 
                      [&::-moz-range-thumb]:cursor-pointer 
                      [&::-moz-range-thumb]:shadow-lg 
                      [&::-moz-range-thumb]:border-[3px] 
                      [&::-moz-range-thumb]:border-[#0a0e14]
                      hover:[&::-webkit-slider-thumb]:scale-110 
                      hover:[&::-webkit-slider-thumb]:shadow-xl
                      hover:[&::-moz-range-thumb]:scale-110 
                      hover:[&::-moz-range-thumb]:shadow-xl
                      focus:outline-none'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-2'>
                    <span>0m</span>
                    <span>+120m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='px-6 py-4 border-t border-white/10 bg-[#0a0e14]/50 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  hasUnsavedChanges ? "bg-yellow-400" : "bg-green-400"
                } animate-pulse`}
              ></div>
              <span className='text-sm text-gray-400'>
                {hasUnsavedChanges ? "Unsaved changes" : "System Healthy"}
              </span>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={handleDiscard}
                disabled={!hasUnsavedChanges}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  hasUnsavedChanges
                    ? "bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600"
                    : "bg-gray-800/30 text-gray-600 cursor-not-allowed"
                }`}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  hasUnsavedChanges
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30"
                    : "bg-gray-800/30 text-gray-600 cursor-not-allowed"
                }`}
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
                  />
                </svg>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
