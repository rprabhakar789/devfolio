import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiGithub, FiLinkedin, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { portfolioContent } from '../content/loadContent';
import '../styles/Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', message: '' });
  };

  const iconByKey = {
    email: FiMail,
    linkedin: FiLinkedin,
    github: FiGithub,
    resume: FiDownload,
    phone: FiPhone,
    location: FiMapPin
  };
  const contactLinks = [
    {
      key: 'email',
      label: 'Email',
      value: portfolioContent.contact.email,
      href: `mailto:${portfolioContent.contact.email}`
    },
    ...portfolioContent.contact.links.map((link) => ({
      ...link,
      key: link.key,
      download: link.key === 'resume'
    }))
  ];
  if (portfolioContent.contact.phone) {
    contactLinks.push({
      key: 'phone',
      label: 'Phone',
      value: portfolioContent.contact.phone,
      href: `tel:${portfolioContent.contact.phone}`
    });
  }
  if (portfolioContent.contact.location) {
    contactLinks.push({
      key: 'location',
      label: 'Location',
      value: portfolioContent.contact.location,
      href: '#'
    });
  }

  return (
    <section id="contact" className="contact">
      <h2>Let's Connect</h2>

      <div className="contact-container">
        <motion.div
          className="contact-links"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3>Get in Touch</h3>
          <div className="links-grid">
            {contactLinks.map((link) => {
              const Icon = iconByKey[link.key] || FiMail;
              const isLocation = link.key === 'location';
              const isHttpLink = /^https?:\/\//i.test(link.href);
              return (
                <motion.a
                  key={link.key}
                  href={link.href}
                  target={isHttpLink ? '_blank' : undefined}
                  rel={isHttpLink ? 'noopener noreferrer' : undefined}
                  download={link.download ? 'Rahul-Prabhakar-Resume.pdf' : undefined}
                  className="contact-link"
                  onClick={isLocation ? (event) => event.preventDefault() : undefined}
                  whileHover={{ scale: 1.05, x: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={24} />
                  <div>
                    <p className="link-label">{link.label}</p>
                    <p className="link-value">{link.value}</p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        <motion.form
          className="contact-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3>Send Me a Message</h3>

          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <motion.button
            type="submit"
            className="submit-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send Message
          </motion.button>

          {submitted && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ✓ Thanks for reaching out! I'll get back to you soon.
            </motion.div>
          )}
        </motion.form>
      </div>
    </section>
  );
}

export default Contact;
