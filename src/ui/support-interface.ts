/**
 * Support Interface - UI components for customer support
 * Provides user-facing support tools and ticket management
 */

import { SupportSystem, SupportTicket, FAQ } from '../core/support-system.js';

export interface SupportInterfaceOptions {
  container: HTMLElement;
  theme: 'light' | 'dark';
  showFAQFirst: boolean;
  enableLiveChat: boolean;
  maxAttachmentSize: number; // MB
  allowedFileTypes: string[];
}

export class SupportInterface {
  private supportSystem: SupportSystem;
  private container: HTMLElement;
  private options: SupportInterfaceOptions;
  private currentView: 'main' | 'faq' | 'ticket_form' | 'ticket_list' | 'ticket_view' = 'main';
  private currentTicket: SupportTicket | null = null;

  constructor(options: Partial<SupportInterfaceOptions> = {}) {
    this.supportSystem = SupportSystem.getInstance();
    this.options = {
      container: options.container || document.body,
      theme: options.theme || 'light',
      showFAQFirst: options.showFAQFirst !== false,
      enableLiveChat: options.enableLiveChat || false,
      maxAttachmentSize: options.maxAttachmentSize || 5,
      allowedFileTypes: options.allowedFileTypes || ['image/png', 'image/jpeg', 'image/gif', 'text/plain']
    };
    this.container = this.options.container;
  }

  /**
   * Initialize the support interface
   */
  initialize(): void {
    this.createSupportWidget();
    this.attachEventListeners();
  }

  /**
   * Show the support panel
   */
  show(): void {
    const panel = this.container.querySelector('.support-panel') as HTMLElement;
    if (panel) {
      panel.style.display = 'flex';
      if (this.options.showFAQFirst) {
        this.showFAQ();
      } else {
        this.showMainMenu();
      }
    }
  }

  /**
   * Hide the support panel
   */
  hide(): void {
    const panel = this.container.querySelector('.support-panel') as HTMLElement;
    if (panel) {
      panel.style.display = 'none';
    }
  }

  /**
   * Show FAQ section
   */
  showFAQ(): void {
    this.currentView = 'faq';
    this.renderFAQ();
  }

  /**
   * Show ticket creation form
   */
  showTicketForm(): void {
    this.currentView = 'ticket_form';
    this.renderTicketForm();
  }

  /**
   * Show user's tickets
   */
  showTicketList(userId: string): void {
    this.currentView = 'ticket_list';
    this.renderTicketList(userId);
  }

  /**
   * Show specific ticket
   */
  showTicket(ticketId: string): void {
    const ticket = this.supportSystem.getTicket(ticketId);
    if (ticket) {
      this.currentTicket = ticket;
      this.currentView = 'ticket_view';
      this.renderTicketView();
    }
  }

  private createSupportWidget(): void {
    // Create floating support button
    const supportButton = document.createElement('button');
    supportButton.className = 'support-widget-button';
    supportButton.innerHTML = '❓';
    supportButton.title = 'Get Help';
    
    Object.assign(supportButton.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#FF6B35',
      color: 'white',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
      zIndex: '9999',
      transition: 'all 0.3s ease'
    });

    supportButton.addEventListener('mouseenter', () => {
      supportButton.style.transform = 'scale(1.1)';
      supportButton.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)';
    });

    supportButton.addEventListener('mouseleave', () => {
      supportButton.style.transform = 'scale(1)';
      supportButton.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
    });

    supportButton.addEventListener('click', () => {
      this.show();
    });

    // Create support panel
    const supportPanel = document.createElement('div');
    supportPanel.className = 'support-panel';
    
    Object.assign(supportPanel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(500px, 90vw)',
      height: 'min(600px, 80vh)',
      backgroundColor: this.options.theme === 'dark' ? '#1a1a1a' : 'white',
      color: this.options.theme === 'dark' ? 'white' : '#333',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: '10000',
      display: 'none',
      flexDirection: 'column',
      overflow: 'hidden'
    });

    // Create header
    const header = this.createHeader();
    supportPanel.appendChild(header);

    // Create content area
    const content = document.createElement('div');
    content.className = 'support-content';
    Object.assign(content.style, {
      flex: '1',
      overflow: 'auto',
      padding: '20px'
    });
    supportPanel.appendChild(content);

    this.container.appendChild(supportButton);
    this.container.appendChild(supportPanel);
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'support-header';
    Object.assign(header.style, {
      padding: '16px 20px',
      borderBottom: `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: this.options.theme === 'dark' ? '#2a2a2a' : '#f8f9fa'
    });

    const title = document.createElement('h2');
    title.textContent = 'UpPaws Support';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: this.options.theme === 'dark' ? 'white' : '#333'
    });

    closeButton.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  private showMainMenu(): void {
    this.currentView = 'main';
    const content = this.container.querySelector('.support-content') as HTMLElement;
    content.innerHTML = '';

    const menuItems = [
      {
        icon: '📚',
        title: 'Frequently Asked Questions',
        description: 'Find quick answers to common questions',
        action: () => this.showFAQ()
      },
      {
        icon: '🎫',
        title: 'Submit a Ticket',
        description: 'Get personalized help from our support team',
        action: () => this.showTicketForm()
      },
      {
        icon: '📋',
        title: 'My Tickets',
        description: 'View and manage your support requests',
        action: () => this.showTicketList('current_user') // Would get actual user ID
      }
    ];

    if (this.options.enableLiveChat) {
      menuItems.push({
        icon: '💬',
        title: 'Live Chat',
        description: 'Chat with a support agent in real-time',
        action: () => this.startLiveChat()
      });
    }

    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'support-menu-item';
      Object.assign(menuItem.style, {
        padding: '16px',
        border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`,
        borderRadius: '8px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      });

      const icon = document.createElement('div');
      icon.textContent = item.icon;
      icon.style.fontSize = '24px';

      const textContainer = document.createElement('div');
      textContainer.style.flex = '1';

      const title = document.createElement('div');
      title.textContent = item.title;
      title.style.fontWeight = '500';
      title.style.marginBottom = '4px';

      const description = document.createElement('div');
      description.textContent = item.description;
      description.style.fontSize = '13px';
      description.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';

      textContainer.appendChild(title);
      textContainer.appendChild(description);

      menuItem.appendChild(icon);
      menuItem.appendChild(textContainer);

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = this.options.theme === 'dark' ? '#333' : '#f8f9fa';
        menuItem.style.borderColor = '#FF6B35';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = '';
        menuItem.style.borderColor = this.options.theme === 'dark' ? '#333' : '#e5e5e5';
      });

      menuItem.addEventListener('click', item.action);

      content.appendChild(menuItem);
    });
  }

  private renderFAQ(): void {
    const content = this.container.querySelector('.support-content') as HTMLElement;
    content.innerHTML = '';

    // Back button
    const backButton = this.createBackButton(() => this.showMainMenu());
    content.appendChild(backButton);

    // Search box
    const searchContainer = document.createElement('div');
    searchContainer.style.marginBottom = '20px';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search FAQs...';
    Object.assign(searchInput.style, {
      width: '100%',
      padding: '10px',
      border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#ddd'}`,
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: this.options.theme === 'dark' ? '#2a2a2a' : 'white',
      color: this.options.theme === 'dark' ? 'white' : '#333'
    });

    let searchTimeout: number;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        const query = (e.target as HTMLInputElement).value;
        this.renderFAQResults(query);
      }, 300);
    });

    searchContainer.appendChild(searchInput);
    content.appendChild(searchContainer);

    // FAQ categories
    this.renderFAQResults('');
  }

  private renderFAQResults(query: string): void {
    const content = this.container.querySelector('.support-content') as HTMLElement;
    const existingResults = content.querySelector('.faq-results');
    if (existingResults) {
      existingResults.remove();
    }

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'faq-results';

    const faqs = query ? this.supportSystem.searchFAQs(query) : this.supportSystem.getFAQs();

    if (faqs.length === 0) {
      const noResults = document.createElement('p');
      noResults.textContent = 'No FAQs found. Try a different search term or submit a ticket for personalized help.';
      noResults.style.textAlign = 'center';
      noResults.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';
      noResults.style.marginTop = '40px';
      resultsContainer.appendChild(noResults);
    } else {
      // Group by category if not searching
      if (!query) {
        const categories = new Map<string, FAQ[]>();
        faqs.forEach(faq => {
          if (!categories.has(faq.category)) {
            categories.set(faq.category, []);
          }
          categories.get(faq.category)!.push(faq);
        });

        categories.forEach((categoryFAQs, category) => {
          const categorySection = this.createFAQCategory(category, categoryFAQs);
          resultsContainer.appendChild(categorySection);
        });
      } else {
        // Show search results
        const searchTitle = document.createElement('h3');
        searchTitle.textContent = `Search Results (${faqs.length})`;
        searchTitle.style.marginBottom = '16px';
        resultsContainer.appendChild(searchTitle);

        faqs.forEach(faq => {
          const faqItem = this.createFAQItem(faq);
          resultsContainer.appendChild(faqItem);
        });
      }
    }

    content.appendChild(resultsContainer);
  }

  private createFAQCategory(category: string, faqs: FAQ[]): HTMLElement {
    const categorySection = document.createElement('div');
    categorySection.style.marginBottom = '24px';

    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryTitle.style.marginBottom = '12px';
    categoryTitle.style.fontSize = '16px';
    categoryTitle.style.fontWeight = '600';
    categoryTitle.style.color = '#FF6B35';

    categorySection.appendChild(categoryTitle);

    faqs.forEach(faq => {
      const faqItem = this.createFAQItem(faq);
      categorySection.appendChild(faqItem);
    });

    return categorySection;
  }

  private createFAQItem(faq: FAQ): HTMLElement {
    const faqItem = document.createElement('div');
    faqItem.className = 'faq-item';
    Object.assign(faqItem.style, {
      border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`,
      borderRadius: '6px',
      marginBottom: '8px',
      overflow: 'hidden'
    });

    const question = document.createElement('div');
    question.className = 'faq-question';
    question.textContent = faq.question;
    Object.assign(question.style, {
      padding: '12px 16px',
      fontWeight: '500',
      cursor: 'pointer',
      backgroundColor: this.options.theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
      borderBottom: `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });

    const expandIcon = document.createElement('span');
    expandIcon.textContent = '▼';
    expandIcon.style.fontSize = '12px';
    expandIcon.style.transition = 'transform 0.2s ease';
    question.appendChild(expandIcon);

    const answer = document.createElement('div');
    answer.className = 'faq-answer';
    answer.textContent = faq.answer;
    Object.assign(answer.style, {
      padding: '16px',
      lineHeight: '1.6',
      display: 'none'
    });

    const helpfulnessContainer = document.createElement('div');
    helpfulnessContainer.style.padding = '12px 16px';
    helpfulnessContainer.style.borderTop = `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`;
    helpfulnessContainer.style.display = 'none';
    helpfulnessContainer.style.textAlign = 'center';

    const helpfulText = document.createElement('span');
    helpfulText.textContent = 'Was this helpful? ';
    helpfulText.style.fontSize = '13px';
    helpfulText.style.marginRight = '8px';

    const yesButton = document.createElement('button');
    yesButton.textContent = '👍 Yes';
    yesButton.style.marginRight = '8px';
    this.styleHelpfulButton(yesButton);

    const noButton = document.createElement('button');
    noButton.textContent = '👎 No';
    this.styleHelpfulButton(noButton);

    yesButton.addEventListener('click', () => {
      this.supportSystem.rateFAQ(faq.id, true);
      this.showFeedbackMessage('Thanks for your feedback!');
    });

    noButton.addEventListener('click', () => {
      this.supportSystem.rateFAQ(faq.id, false);
      this.showTicketForm(); // Redirect to ticket form if FAQ wasn't helpful
    });

    helpfulnessContainer.appendChild(helpfulText);
    helpfulnessContainer.appendChild(yesButton);
    helpfulnessContainer.appendChild(noButton);

    let isExpanded = false;
    question.addEventListener('click', () => {
      isExpanded = !isExpanded;
      answer.style.display = isExpanded ? 'block' : 'none';
      helpfulnessContainer.style.display = isExpanded ? 'block' : 'none';
      expandIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    faqItem.appendChild(question);
    faqItem.appendChild(answer);
    faqItem.appendChild(helpfulnessContainer);

    return faqItem;
  }

  private renderTicketForm(): void {
    const content = this.container.querySelector('.support-content') as HTMLElement;
    content.innerHTML = '';

    // Back button
    const backButton = this.createBackButton(() => this.showMainMenu());
    content.appendChild(backButton);

    // Form title
    const title = document.createElement('h3');
    title.textContent = 'Submit a Support Ticket';
    title.style.marginBottom = '20px';
    content.appendChild(title);

    // Form
    const form = document.createElement('form');
    form.className = 'ticket-form';

    // Subject field
    const subjectGroup = this.createFormGroup('Subject', 'input');
    const subjectInput = subjectGroup.querySelector('input') as HTMLInputElement;
    subjectInput.required = true;
    subjectInput.placeholder = 'Brief description of your issue';
    form.appendChild(subjectGroup);

    // Category field
    const categoryGroup = this.createFormGroup('Category', 'select');
    const categorySelect = categoryGroup.querySelector('select') as HTMLSelectElement;
    const categories = [
      { value: 'bug', label: 'Bug Report' },
      { value: 'gameplay', label: 'Gameplay Help' },
      { value: 'account', label: 'Account Issues' },
      { value: 'payment', label: 'Payment Problems' },
      { value: 'feature_request', label: 'Feature Request' },
      { value: 'other', label: 'Other' }
    ];
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.value;
      option.textContent = cat.label;
      categorySelect.appendChild(option);
    });
    form.appendChild(categoryGroup);

    // Description field
    const descriptionGroup = this.createFormGroup('Description', 'textarea');
    const descriptionTextarea = descriptionGroup.querySelector('textarea') as HTMLTextAreaElement;
    descriptionTextarea.required = true;
    descriptionTextarea.placeholder = 'Please provide detailed information about your issue...';
    descriptionTextarea.rows = 6;
    form.appendChild(descriptionGroup);

    // File attachment
    const attachmentGroup = this.createFormGroup('Attachments (optional)', 'file');
    const fileInput = attachmentGroup.querySelector('input') as HTMLInputElement;
    fileInput.multiple = true;
    fileInput.accept = this.options.allowedFileTypes.join(',');
    form.appendChild(attachmentGroup);

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit Ticket';
    Object.assign(submitButton.style, {
      width: '100%',
      padding: '12px',
      backgroundColor: '#FF6B35',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '20px'
    });

    submitButton.addEventListener('mouseenter', () => {
      submitButton.style.backgroundColor = '#e55a2b';
    });

    submitButton.addEventListener('mouseleave', () => {
      submitButton.style.backgroundColor = '#FF6B35';
    });

    form.appendChild(submitButton);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleTicketSubmission(form);
    });

    content.appendChild(form);
  }

  private renderTicketList(userId: string): void {
    const content = this.container.querySelector('.support-content') as HTMLElement;
    content.innerHTML = '';

    // Back button
    const backButton = this.createBackButton(() => this.showMainMenu());
    content.appendChild(backButton);

    // Title
    const title = document.createElement('h3');
    title.textContent = 'My Support Tickets';
    title.style.marginBottom = '20px';
    content.appendChild(title);

    const tickets = this.supportSystem.getUserTickets(userId);

    if (tickets.length === 0) {
      const noTickets = document.createElement('p');
      noTickets.textContent = 'You haven\'t submitted any support tickets yet.';
      noTickets.style.textAlign = 'center';
      noTickets.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';
      noTickets.style.marginTop = '40px';
      content.appendChild(noTickets);
      return;
    }

    tickets.forEach(ticket => {
      const ticketItem = this.createTicketListItem(ticket);
      content.appendChild(ticketItem);
    });
  }

  private renderTicketView(): void {
    if (!this.currentTicket) return;

    const content = this.container.querySelector('.support-content') as HTMLElement;
    content.innerHTML = '';

    // Back button
    const backButton = this.createBackButton(() => this.showTicketList('current_user'));
    content.appendChild(backButton);

    // Ticket header
    const header = document.createElement('div');
    header.style.marginBottom = '20px';

    const title = document.createElement('h3');
    title.textContent = this.currentTicket.subject;
    title.style.marginBottom = '8px';

    const meta = document.createElement('div');
    meta.style.fontSize = '13px';
    meta.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';
    meta.innerHTML = `
      <strong>Ticket #${this.currentTicket.id}</strong> • 
      Status: <span style="color: ${this.getStatusColor(this.currentTicket.status)}">${this.currentTicket.status}</span> • 
      Created: ${this.currentTicket.createdAt.toLocaleDateString()}
    `;

    header.appendChild(title);
    header.appendChild(meta);
    content.appendChild(header);

    // Ticket description
    const description = document.createElement('div');
    description.style.padding = '16px';
    description.style.backgroundColor = this.options.theme === 'dark' ? '#2a2a2a' : '#f8f9fa';
    description.style.borderRadius = '6px';
    description.style.marginBottom = '20px';
    description.style.lineHeight = '1.6';
    description.textContent = this.currentTicket.description;
    content.appendChild(description);

    // Responses
    if (this.currentTicket.responses.length > 0) {
      const responsesTitle = document.createElement('h4');
      responsesTitle.textContent = 'Responses';
      responsesTitle.style.marginBottom = '12px';
      content.appendChild(responsesTitle);

      this.currentTicket.responses.forEach(response => {
        const responseItem = this.createResponseItem(response);
        content.appendChild(responseItem);
      });
    }

    // Add response form if ticket is open
    if (['open', 'in_progress', 'waiting_user'].includes(this.currentTicket.status)) {
      const responseForm = this.createResponseForm();
      content.appendChild(responseForm);
    }
  }

  private createBackButton(onClick: () => void): HTMLElement {
    const backButton = document.createElement('button');
    backButton.textContent = '← Back';
    Object.assign(backButton.style, {
      background: 'none',
      border: 'none',
      color: '#FF6B35',
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '20px',
      padding: '4px 0'
    });

    backButton.addEventListener('click', onClick);
    return backButton;
  }

  private createFormGroup(label: string, type: 'input' | 'select' | 'textarea' | 'file'): HTMLElement {
    const group = document.createElement('div');
    group.style.marginBottom = '16px';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '6px';
    labelElement.style.fontWeight = '500';

    let input: HTMLElement;
    switch (type) {
      case 'input':
        input = document.createElement('input');
        (input as HTMLInputElement).type = 'text';
        break;
      case 'select':
        input = document.createElement('select');
        break;
      case 'textarea':
        input = document.createElement('textarea');
        break;
      case 'file':
        input = document.createElement('input');
        (input as HTMLInputElement).type = 'file';
        break;
    }

    Object.assign(input.style, {
      width: '100%',
      padding: '10px',
      border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#ddd'}`,
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: this.options.theme === 'dark' ? '#2a2a2a' : 'white',
      color: this.options.theme === 'dark' ? 'white' : '#333'
    });

    group.appendChild(labelElement);
    group.appendChild(input);

    return group;
  }

  private createTicketListItem(ticket: SupportTicket): HTMLElement {
    const item = document.createElement('div');
    item.className = 'ticket-list-item';
    Object.assign(item.style, {
      padding: '16px',
      border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#e5e5e5'}`,
      borderRadius: '6px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    });

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    const title = document.createElement('div');
    title.textContent = ticket.subject;
    title.style.fontWeight = '500';

    const status = document.createElement('span');
    status.textContent = ticket.status;
    status.style.padding = '4px 8px';
    status.style.borderRadius = '4px';
    status.style.fontSize = '12px';
    status.style.fontWeight = '500';
    status.style.backgroundColor = this.getStatusColor(ticket.status);
    status.style.color = 'white';

    header.appendChild(title);
    header.appendChild(status);

    const meta = document.createElement('div');
    meta.style.fontSize = '13px';
    meta.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';
    meta.textContent = `#${ticket.id} • ${ticket.createdAt.toLocaleDateString()}`;

    item.appendChild(header);
    item.appendChild(meta);

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = this.options.theme === 'dark' ? '#333' : '#f8f9fa';
      item.style.borderColor = '#FF6B35';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '';
      item.style.borderColor = this.options.theme === 'dark' ? '#333' : '#e5e5e5';
    });

    item.addEventListener('click', () => {
      this.showTicket(ticket.id);
    });

    return item;
  }

  private createResponseItem(response: any): HTMLElement {
    const item = document.createElement('div');
    item.style.marginBottom = '16px';
    item.style.padding = '12px';
    item.style.borderRadius = '6px';
    item.style.backgroundColor = response.authorType === 'user' 
      ? (this.options.theme === 'dark' ? '#2a2a2a' : '#f0f8ff')
      : (this.options.theme === 'dark' ? '#1a3a1a' : '#f0fff0');

    const header = document.createElement('div');
    header.style.fontSize = '13px';
    header.style.color = this.options.theme === 'dark' ? '#ccc' : '#666';
    header.style.marginBottom = '8px';
    header.textContent = `${response.authorType === 'user' ? 'You' : 'Support'} • ${response.createdAt.toLocaleDateString()}`;

    const content = document.createElement('div');
    content.style.lineHeight = '1.6';
    content.textContent = response.content;

    item.appendChild(header);
    item.appendChild(content);

    return item;
  }

  private createResponseForm(): HTMLElement {
    const form = document.createElement('form');
    form.style.marginTop = '20px';

    const title = document.createElement('h4');
    title.textContent = 'Add Response';
    title.style.marginBottom = '12px';
    form.appendChild(title);

    const textareaGroup = this.createFormGroup('Your message', 'textarea');
    const textarea = textareaGroup.querySelector('textarea') as HTMLTextAreaElement;
    textarea.required = true;
    textarea.placeholder = 'Type your response here...';
    textarea.rows = 4;
    form.appendChild(textareaGroup);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Send Response';
    Object.assign(submitButton.style, {
      padding: '10px 20px',
      backgroundColor: '#FF6B35',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer'
    });

    form.appendChild(submitButton);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.currentTicket) {
        await this.supportSystem.addResponse(this.currentTicket.id, {
          authorId: 'current_user', // Would get actual user ID
          authorType: 'user',
          content: textarea.value
        });
        this.renderTicketView(); // Refresh view
      }
    });

    return form;
  }

  private styleHelpfulButton(button: HTMLButtonElement): void {
    Object.assign(button.style, {
      padding: '4px 8px',
      border: `1px solid ${this.options.theme === 'dark' ? '#333' : '#ddd'}`,
      borderRadius: '4px',
      backgroundColor: this.options.theme === 'dark' ? '#2a2a2a' : 'white',
      color: this.options.theme === 'dark' ? 'white' : '#333',
      fontSize: '12px',
      cursor: 'pointer'
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#FF6B35';
      button.style.color = 'white';
      button.style.borderColor = '#FF6B35';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = this.options.theme === 'dark' ? '#2a2a2a' : 'white';
      button.style.color = this.options.theme === 'dark' ? 'white' : '#333';
      button.style.borderColor = this.options.theme === 'dark' ? '#333' : '#ddd';
    });
  }

  private getStatusColor(status: string): string {
    const colors = {
      'open': '#FF6B35',
      'in_progress': '#007bff',
      'waiting_user': '#ffc107',
      'resolved': '#28a745',
      'closed': '#6c757d'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  }

  private async handleTicketSubmission(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    
    try {
      const ticket = await this.supportSystem.createTicket({
        userId: 'current_user', // Would get actual user ID
        username: 'Current User', // Would get actual username
        subject: formData.get('subject') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as any,
        metadata: {
          userAgent: navigator.userAgent,
          gameVersion: '1.0.0', // Would get actual version
          platform: navigator.platform
        }
      });

      this.showTicket(ticket.id);
      this.showFeedbackMessage('Ticket submitted successfully!');
    } catch (error) {
      this.showFeedbackMessage('Error submitting ticket. Please try again.', 'error');
    }
  }

  private showFeedbackMessage(message: string, type: 'success' | 'error' = 'success'): void {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    Object.assign(feedback.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '6px',
      backgroundColor: type === 'success' ? '#28a745' : '#dc3545',
      color: 'white',
      zIndex: '10001',
      fontSize: '14px',
      fontWeight: '500'
    });

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 3000);
  }

  private startLiveChat(): void {
    // Placeholder for live chat functionality
    this.showFeedbackMessage('Live chat is not available at the moment. Please submit a ticket instead.');
    this.showTicketForm();
  }

  private attachEventListeners(): void {
    // Handle escape key to close panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    // Handle click outside to close panel
    document.addEventListener('click', (e) => {
      const panel = this.container.querySelector('.support-panel') as HTMLElement;
      const button = this.container.querySelector('.support-widget-button') as HTMLElement;
      
      if (panel && panel.style.display !== 'none' && 
          !panel.contains(e.target as Node) && 
          !button.contains(e.target as Node)) {
        this.hide();
      }
    });
  }
}

// Global instance
export const supportInterface = new SupportInterface();