export const metadata = { title: "Payment History | Dashboard" };

export default function PaymentsPage() {
    return (
        <>
            <h1 className="panel-page-title">Payment History</h1>

            <div className="panel-card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Product</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Invoice</th>
                                <th>Datetime</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                                        <div className="empty-state-icon" style={{ width: '48px', height: '48px' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                                        </div>
                                        <p className="empty-state-text">No payments yet</p>
                                        <p className="text-sm text-muted mt-1">Your payment history will appear here</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
