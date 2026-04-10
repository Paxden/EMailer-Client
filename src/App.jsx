import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Send, Plus, Trash2, Mail, Users, Settings, AlertCircle } from 'lucide-react';
import './Mailer.css';

const Mailer = () => {
  const [recipients, setRecipients] = useState(['']);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [senderName, setSenderName] = useState('Company Name');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const updateRecipient = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleBulkPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText.split(/[\n,]/).map(email => email.trim()).filter(email => email);
    if (emails.length > 0) {
      e.preventDefault();
      setRecipients(emails);
      toast.success(`Added ${emails.length} recipients!`);
    }
  };

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => email && !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email(s): ${invalidEmails.join(', ')}`);
      return false;
    }
    return true;
  };

  const sendEmails = async () => {
    if (!validateEmails()) return;
    
    const validRecipients = recipients.filter(email => email.trim());
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!emailBody.trim()) {
      toast.error('Please enter email content');
      return;
    }

    setIsSending(true);
    setProgress({ current: 0, total: validRecipients.length });

    try {
      const response = await fetch('http://localhost:5001/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validRecipients,
          subject,
          htmlContent: emailBody,
          senderName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.failed === 0) {
          toast.success(`✅ Success! Sent ${data.successful} emails to ${data.total} recipients!`);
        } else {
          toast.error(`⚠️ Partial success: ${data.successful} sent, ${data.failed} failed`);
          console.log('Failed emails:', data.failedEmails);
        }
        
        // Clear form after successful send
        if (data.successful > 0) {
          setRecipients(['']);
          setSubject('');
          setEmailBody('');
        }
      } else {
        toast.error(data.error || 'Failed to send emails');
      }
    } catch (error) {
      toast.error('Connection error. Is the backend server running?');
      console.error(error);
    } finally {
      setIsSending(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const testConnection = async () => {
    const testEmail = prompt('Enter email address to send test message:');
    if (!testEmail) return;

    try {
      const response = await fetch('http://localhost:5001/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('✅ Test email sent! Check your inbox.');
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Cannot connect to backend server');
    }
  };

  return (
    <div className="mailer-container">
      <Toaster position="top-right" />
      
      <div className="mailer-header">
        <h1>
          <Mail className="header-icon" />
          Company Email Mailer
        </h1>
        <button onClick={testConnection} className="test-btn">
          <Settings size={16} />
          Test Connection
        </button>
      </div>

      <div className="mailer-content">
        {/* Sender Name */}
        <div className="form-group">
          <label>
            <Users size={16} />
            Sender Name
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Your Company Name"
            className="form-input"
          />
        </div>

        {/* Recipients */}
        <div className="form-group">
          <label>
            <Mail size={16} />
            Recipients
            <span className="label-hint">(Click "Add" or paste multiple emails)</span>
          </label>
          
          <div className="recipients-list">
            {recipients.map((email, index) => (
              <div key={index} className="recipient-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  placeholder="email@example.com"
                  className="recipient-input"
                  onPaste={index === 0 ? handleBulkPaste : undefined}
                />
                {recipients.length > 1 && (
                  <button onClick={() => removeRecipient(index)} className="remove-btn">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button onClick={addRecipient} className="add-btn">
            <Plus size={16} />
            Add Recipient
          </button>
        </div>

        {/* Subject */}
        <div className="form-group">
          <label>Subject Line</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="form-input"
          />
        </div>

        {/* Email Body */}
        <div className="form-group">
          <label>Email Content (HTML supported)</label>
          <div className="editor-toolbar">
            <button type="button" onClick={() => setEmailBody(emailBody + '<br/>')}>Add Line Break</button>
            <button type="button" onClick={() => setEmailBody(emailBody + '<strong></strong>')}>Bold</button>
            <button type="button" onClick={() => setEmailBody(emailBody + '<p></p>')}>Paragraph</button>
          </div>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="<h1>Hello!</h1><p>Your message here...</p>"
            className="email-body-input"
            rows="10"
          />
          <div className="preview-area">
            <strong>Preview:</strong>
            <div className="preview-content" dangerouslySetInnerHTML={{ __html: emailBody || 'Your email preview will appear here...' }} />
          </div>
        </div>

        {/* Send Button */}
        <div className="actions">
          {isSending && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
              <span>Sending {progress.current} of {progress.total}...</span>
            </div>
          )}
          
          <button 
            onClick={sendEmails} 
            disabled={isSending}
            className="send-btn"
          >
            <Send size={18} />
            {isSending ? 'Sending...' : `Send to ${recipients.filter(e => e).length} recipient(s)`}
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <AlertCircle size={16} />
          <div>
            <strong>Important Notes:</strong>
            <ul>
              <li>Gmail free accounts: max 500 emails/day</li>
              <li>Emails are sent with 2-second delays to avoid rate limiting</li>
              <li>HTML formatting is supported in email content</li>
              <li>Use App Password, not your regular Gmail password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mailer;