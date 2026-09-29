import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info 
} from 'lucide-react'

// ---------- Reusable primitives ----------

const Badge = ({ value, variant }) => {
  // Auto-detect variant from value if not provided
  const v = variant || (
    ['good', 'yes', 'consistent', 'pass', 'healthy', 'active', 'verified'].includes(
      String(value).toLowerCase()
    ) ? 'good'
    : ['poor', 'no', 'fail', 'mismatch', 'corrupt', 'critical'].includes(
        String(value).toLowerCase()
      ) ? 'bad'
    : ['fair', 'warning', 'medium'].includes(String(value).toLowerCase())
      ? 'warn'
      : 'neutral'
  )

  const styles = {
    good:    'bg-green-50 text-green-700 border border-green-200',
    bad:     'bg-red-50 text-red-700 border border-red-200',
    warn:    'bg-yellow-50 text-yellow-700 border border-yellow-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[v]}`}>
      {value}
    </span>
  )
}

const Row = ({ label, value, isBadge }) => {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-[#F0F0F0] last:border-0">
      <span className="text-sm text-[#555555]">{label}</span>
      <span className="text-sm font-medium text-[#111111] text-right break-words max-w-[60%]">
        {isBadge ? <Badge value={value} /> : String(value)}
      </span>
    </div>
  )
}

const Section = ({ title, children }) => (
  <div className="border-t border-[#E5E5E5] pt-6 mt-6">
    <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wider mb-3">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
)

const SubSection = ({ title, children }) => (
  <div className="mt-3 pl-3 border-l-2 border-[#E5E5E5]">
    <p className="text-xs font-semibold text-[#555555] mb-1">{title}</p>
    {children}
  </div>
)

const Note = ({ children }) => (
  <div className="flex gap-2 items-start text-xs text-[#6b7280] italic mt-1 mb-2">
    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
)

const Check = ({ name, result, detail }) => (
  <div className="bg-[#F6F6F6] rounded-lg p-3 my-2">
    <div className="flex justify-between items-center">
      <span className="text-xs text-[#555555] font-mono">{name}</span>
      <Badge value={result} />
    </div>
    {detail && typeof detail === 'object' && (
      <div className="mt-2">
        {Object.entries(detail).map(([k, v]) => (
          <Row
            key={k}
            label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            value={typeof v === 'object' ? JSON.stringify(v) : v}
          />
        ))}
      </div>
    )}
  </div>
)

// ---------- Section renderers ----------

const SystemSection = ({ data }) => {
  const sys = data.system || {}
  const trace = sys.traceability || {}
  return (
    <Section title="System">
      <Row label="Hostname" value={sys.hostname} />
      <Row label="OS" value={sys.os} />
      <Row label="OS Version" value={sys.os_version} />
      <Row label="OS Release" value={sys.os_release} />
      <Row label="Machine" value={sys.machine} />
      {sys.python_version && <Row label="Python Version" value={sys.python_version} />}

      {Object.keys(trace).length > 0 && (
        <SubSection title="Traceability">
          <Row label="Manufacturer" value={trace.manufacturer} />
          <Row label="Model" value={trace.model} />
          <Row label="Serial Number" value={trace.serial_number} />
          {trace.bios_version && <Row label="BIOS Version" value={trace.bios_version} />}
          {trace.bios_release_date && (
            <Row
              label="BIOS Release Date"
              value={String(trace.bios_release_date).replace(/\/Date\((\d+)\)\//, (_, ms) =>
                new Date(Number(ms)).toLocaleDateString()
              )}
            />
          )}
          {trace.mac_addresses && (
            <SubSection title="MAC Addresses">
              {Object.entries(trace.mac_addresses).map(([k, v]) => (
                <Row key={k} label={k} value={v} />
              ))}
            </SubSection>
          )}
        </SubSection>
      )}
    </Section>
  )
}

const VerificationSection = ({ title, data }) => {
  if (!data) return null
  return (
    <Section title={title}>
      {data.component && <Row label="Component" value={data.component} />}

      {data.sources && (
        <SubSection title="Sources">
          {Object.entries(data.sources).map(([k, v]) => (
            <Row
              key={k}
              label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              value={typeof v === 'object' ? JSON.stringify(v) : v}
            />
          ))}
        </SubSection>
      )}

      {Array.isArray(data.checks) &&
        data.checks.map((c, i) => (
          <Check key={i} name={c.name} result={c.result} detail={c.detail} />
        ))}

      {data.verdict && <Row label="Verdict" value={data.verdict} isBadge />}
      {data.confidence && <Row label="Confidence" value={data.confidence} isBadge />}
      {data.note && <Note>{data.note}</Note>}
    </Section>
  )
}

const PowerSection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Power">
      <Row label="Present" value={data.present ? 'Yes' : 'No'} isBadge />
      <Row label="Percent Now" value={data.percent_now} />
      <Row label="Plugged In" value={data.plugged_in ? 'Yes' : 'No'} isBadge />
      {data.design_capacity_mwh && <Row label="Design Capacity (mWh)" value={data.design_capacity_mwh} />}
      {data.full_charge_capacity_mwh && <Row label="Full Charge Capacity (mWh)" value={data.full_charge_capacity_mwh} />}
      {data.health_percent !== undefined && <Row label="Health Percent" value={`${data.health_percent}%`} />}
      {data.cycle_count !== undefined && <Row label="Cycle Count" value={data.cycle_count} />}
      {data.grade && <Row label="Grade" value={data.grade} isBadge />}
      {data.discharge_rate_test?.detail && (
        <SubSection title="Discharge Rate Test">
          <Note>{data.discharge_rate_test.detail}</Note>
        </SubSection>
      )}
      {data.notes && <Note>{data.notes}</Note>}
    </Section>
  )
}

const CpuSection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="CPU">
      <Row label="Model" value={data.model} />
      <Row label="Physical Cores" value={data.physical_cores} />
      <Row label="Logical Cores" value={data.logical_cores} />
      {data.clock_speed && (
        <SubSection title="Clock Speed">
          <Row label="Current MHz" value={data.clock_speed.current_mhz} />
          <Row label="Min MHz" value={data.clock_speed.min_mhz ?? 'Unknown'} />
          <Row label="Max MHz" value={data.clock_speed.max_mhz} />
        </SubSection>
      )}
      {data.single_thread_score && <Row label="Single Thread Score" value={data.single_thread_score} />}
      {data.multi_thread_score && <Row label="Multi Thread Score" value={data.multi_thread_score} />}
      {data.grade && <Row label="Grade" value={data.grade} isBadge />}

      {data.sustained_load_test && (
        <SubSection title="Sustained Load Test">
          {data.sustained_load_test.throughput_samples && (
            <div className="py-1.5">
              <span className="text-sm text-[#555555]">Throughput Samples</span>
              <ul className="list-disc pl-5 text-sm text-[#111111] mt-1">
                {data.sustained_load_test.throughput_samples.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <Row label="Throughput Drop %" value={data.sustained_load_test.throughput_drop_percent} />
          <Row label="Throttling Grade" value={data.sustained_load_test.throttling_grade} isBadge />
          {data.sustained_load_test.note && <Note>{data.sustained_load_test.note}</Note>}
        </SubSection>
      )}

      {data.temperatures_celsius?.status === 'unavailable' && (
        <Note>{data.temperatures_celsius.detail}</Note>
      )}
    </Section>
  )
}

const MemorySection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Memory">
      <Row label="Total GB" value={data.total_gb} />
      <Row label="Available GB" value={data.available_gb} />
      {data.percent_used !== undefined && <Row label="Percent Used" value={`${data.percent_used}%`} />}

      {Array.isArray(data.modules) && data.modules.length > 0 && (
        <SubSection title="Modules">
          {data.modules.map((m, i) => (
            <div key={i} className="bg-[#F6F6F6] rounded-lg p-3 my-2">
              <Row label="Capacity GB" value={m.capacity_gb} />
              <Row label="Speed MHz" value={m.speed_mhz} />
              <Row label="Manufacturer" value={m.manufacturer} />
              <Row label="Part Number" value={m.part_number} />
            </div>
          ))}
        </SubSection>
      )}

      {data.integrity_test && (
        <SubSection title="Integrity Test">
          <Row label="Tested MB" value={data.integrity_test.tested_mb} />
          <Row label="Errors Found" value={data.integrity_test.errors_found} />
          <Row label="Seconds" value={data.integrity_test.seconds} />
          {data.integrity_test.note && <Note>{data.integrity_test.note}</Note>}
        </SubSection>
      )}
    </Section>
  )
}

const StorageSection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Storage">
      <Row label="Total GB" value={data.total_gb} />
      <Row label="Used GB" value={data.used_gb} />
      <Row label="Free GB" value={data.free_gb} />
      {data.percent_used !== undefined && <Row label="Percent Used" value={`${data.percent_used}%`} />}
      {data.grade && <Row label="Grade" value={data.grade} isBadge />}

      {data.speed_test && (
        <SubSection title="Speed Test">
          <Row label="Write MB/s" value={data.speed_test.write_mb_s} />
          <Row label="Read MB/s" value={data.speed_test.read_mb_s} />
        </SubSection>
      )}

      {data.smart && data.smart.status !== 'unavailable' && (
        <SubSection title="SMART">
          <Row label="Passed" value={data.smart.passed ? 'Yes' : 'No'} isBadge />
          {data.smart.attributes && (
            <SubSection title="Attributes">
              {Object.entries(data.smart.attributes).map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, ' ')} value={v} />
              ))}
            </SubSection>
          )}
        </SubSection>
      )}

      {data.smart?.status === 'unavailable' && <Note>{data.smart.detail}</Note>}

      {Array.isArray(data.drive_type) && data.drive_type.length > 0 && (
        <SubSection title="Drive Type">
          {data.drive_type.map((d, i) => (
            <div key={i} className="bg-[#F6F6F6] rounded-lg p-3 my-2">
              <Row label="Name" value={d.name} />
              <Row label="Media Type" value={d.media_type} />
              <Row label="Bus Type" value={d.bus_type} />
              <Row label="Health Status" value={d.health_status} />
            </div>
          ))}
        </SubSection>
      )}

      {data.bad_sector_deep_scan?.status === 'unavailable' && (
        <Note>{data.bad_sector_deep_scan.detail}</Note>
      )}
    </Section>
  )
}

const GpuSection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="GPU">
      {Array.isArray(data.adapters) && data.adapters.length > 0 && (
        <SubSection title="Adapters">
          {data.adapters.map((a, i) => (
            <div key={i} className="bg-[#F6F6F6] rounded-lg p-3 my-2">
              <Row label="Name" value={a.name} />
              <Row label="Driver Version" value={a.driver_version} />
              <Row label="VRAM GB" value={a.vram_gb} />
              <Row label="Current Resolution" value={a.current_resolution} />
            </div>
          ))}
        </SubSection>
      )}
      {data.benchmark?.status === 'unavailable' && <Note>{data.benchmark.detail}</Note>}
    </Section>
  )
}

const DisplaySection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Display">
      {Array.isArray(data.detected_outputs) && (
        <SubSection title="Detected Outputs">
          {data.detected_outputs.map((o, i) => (
            <div key={i} className="bg-[#F6F6F6] rounded-lg p-3 my-2">
              <Row label="Resolution" value={o.resolution} />
              <Row label="Refresh Rate Hz" value={o.refresh_rate_hz} />
            </div>
          ))}
        </SubSection>
      )}
      <Row label="Connected Monitor Count" value={data.connected_monitor_count} />
    </Section>
  )
}

const ConnectivitySection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Connectivity">
      {data.wifi && (
        <SubSection title="WiFi">
          <Row label="Connected SSID" value={data.wifi.connected_ssid} />
          <Row label="Signal Percent" value={data.wifi.signal_percent} />
          <Row label="Radio Type" value={data.wifi.radio_type} />
        </SubSection>
      )}
      {data.bluetooth && (
        <SubSection title="Bluetooth">
          <Row label="Detected" value={data.bluetooth.detected ? 'Yes' : 'No'} isBadge />
          {Array.isArray(data.bluetooth.devices) && (
            <div className="py-1.5">
              <span className="text-sm text-[#555555]">Devices</span>
              <ul className="list-disc pl-5 text-sm text-[#111111] mt-1">
                {data.bluetooth.devices.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </SubSection>
      )}
      {data.usb_devices && (
        <SubSection title="USB Devices">
          <Row label="Count" value={data.usb_devices.count} />
          {Array.isArray(data.usb_devices.devices) && (
            <ul className="list-disc pl-5 text-sm text-[#111111] mt-1">
              {data.usb_devices.devices.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </SubSection>
      )}
      {data.webcam_detected && (
        <SubSection title="Webcam Detected">
          <Row label="Detected" value={data.webcam_detected.detected ? 'Yes' : 'No'} isBadge />
        </SubSection>
      )}
      {data.sd_card_reader?.status === 'unavailable' && <Note>{data.sd_card_reader.detail}</Note>}
      {data.fingerprint_reader?.status === 'unavailable' && <Note>{data.fingerprint_reader.detail}</Note>}
    </Section>
  )
}

const SecuritySection = ({ data }) => {
  if (!data) return null
  return (
    <Section title="Security">
      {data.tpm && (
        <SubSection title="TPM">
          <Row label="Present" value={data.tpm.TpmPresent ? 'Yes' : 'No'} isBadge />
          <Row label="Ready" value={data.tpm.TpmReady ? 'Yes' : 'No'} isBadge />
          <Row label="Enabled" value={data.tpm.TpmEnabled ? 'Yes' : 'No'} isBadge />
          {data.tpm.ManufacturerVersion && (
            <Row label="Manufacturer Version" value={data.tpm.ManufacturerVersion} />
          )}
        </SubSection>
      )}
      <Row
        label="Secure Boot Enabled"
        value={data.secure_boot_enabled ? 'Yes' : 'No'}
        isBadge
      />
      {data.windows_activation && (
        <SubSection title="Windows Activation">
          <Note>{data.windows_activation}</Note>
        </SubSection>
      )}
      {data.domain_or_mdm_enrollment && (
        <SubSection title="Domain or MDM Enrollment">
          <Row label="Azure AD Joined" value={data.domain_or_mdm_enrollment.azure_ad_joined ? 'Yes' : 'No'} isBadge />
          <Row label="Domain Joined" value={data.domain_or_mdm_enrollment.domain_joined ? 'Yes' : 'No'} isBadge />
          <Row label="Enterprise Joined" value={data.domain_or_mdm_enrollment.enterprise_joined ? 'Yes' : 'No'} isBadge />
          {data.domain_or_mdm_enrollment.note && <Note>{data.domain_or_mdm_enrollment.note}</Note>}
        </SubSection>
      )}
      {data.driver_errors && (
        <SubSection title="Driver Errors">
          <Row label="Count" value={data.driver_errors.count} />
        </SubSection>
      )}
    </Section>
  )
}

// ---------- Verification sections (laptop) ----------

const buildVerificationSections = (data) => {
  const sections = []
  if (data.system_verification) sections.push({ title: 'System Verification', data: data.system_verification })
  if (data.cpu_verification) sections.push({ title: 'CPU Verification', data: data.cpu_verification })
  if (data.gpu_verification) sections.push({ title: 'GPU Verification', data: data.gpu_verification })
  if (data.ram_verification) sections.push({ title: 'RAM Verification', data: data.ram_verification })
  if (data.storage_verification) sections.push({ title: 'Storage Verification', data: data.storage_verification })
  return sections
}

// ---------- Main renderer ----------

const ReportRenderer = ({ data }) => {
  if (!data) return null

  const resaleFlags = data.resale_flags || []
  const needsManual = data.needs_manual_check || []

  return (
    <div className="space-y-0">
      {/* Resale Flags */}
      {resaleFlags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wider mb-2">
            Flags to review before resale
          </h3>
          {resaleFlags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 my-1.5 text-sm text-red-700"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Standard sections */}
      <SystemSection data={data} />
      {buildVerificationSections(data).map((s, i) => (
        <VerificationSection key={i} title={s.title} data={s.data} />
      ))}
      <PowerSection data={data.power} />
      <CpuSection data={data.cpu} />
      <MemorySection data={data.memory} />
      <StorageSection data={data.storage} />
      <GpuSection data={data.gpu} />
      <DisplaySection data={data.display} />
      <ConnectivitySection data={data.connectivity} />
      <SecuritySection data={data.security} />

      {/* Manual checks */}
      {needsManual.length > 0 && (
        <Section title="Needs Manual Check (Not Automatable)">
          <ul className="list-disc pl-5 text-sm text-[#555555] space-y-1">
            {needsManual.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

export default ReportRenderer