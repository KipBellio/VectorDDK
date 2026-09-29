import { supabase } from './supabase'

export const verifyReport = async (reportId) => {
  try {
    console.log('Verifying report ID:', reportId)
    
    if (!reportId || reportId.trim() === '') {
      return {
        success: false,
        error: 'Please enter a valid Report ID.'
      }
    }

    const trimmedId = reportId.trim()

    // Query the report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('report_id', trimmedId)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'Database error: ' + error.message
      }
    }

    if (!report) {
      return {
        success: false,
        error: 'Report not found. Please check the ID and try again.'
      }
    }

    if (report.qr_status !== 'active') {
      return {
        success: false,
        error: 'This report is no longer active for verification.'
      }
    }

    // Increment verification_count
    const newVerificationCount = (report.verification_count || 0) + 1
    
    const { error: updateError } = await supabase
      .from('reports')
      .update({ 
        verification_count: newVerificationCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', report.id)

    if (updateError) {
      console.error('Failed to update verification count:', updateError)
    }

    // Log the verification scan
    await supabase
      .from('qr_scans')
      .insert([{
        report_id: report.id,
        scan_method: 'manual_entry',
        scanned_at: new Date().toISOString()
      }])

    return {
      success: true,
      report: {
        ...report,
        verification_count: newVerificationCount
      }
    }

  } catch (error) {
    console.error('Verification error:', error)
    return {
      success: false,
      error: 'Could not verify report. Please try again.'
    }
  }
}