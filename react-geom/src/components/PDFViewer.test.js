import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import PDFViewer from './PDFViewer';

const pdfUrl = 'https://geom.com/test.pdf';
const fallbackUrl = 'https://beta-geom-1846a6caaf3c.herokuapp.com/assets/static/images/Ex%20Ante/ARG_2014_all.pdf';

jest.mock('@react-pdf-viewer/core', () => ({
  Worker: ({ children }) => <div>{children}</div>,
  Viewer: ({ fileUrl }) => <div data-testid="pdf-viewer">Viewing: {fileUrl}</div>,
}));

describe('PDFViewer component', () => {
  test('renders the loading state', () => {
    render(<PDFViewer fileUrl={pdfUrl} />);


    expect(screen.getByText(/loading pdf/i)).toBeInTheDocument();
  });

  test('renders the PDF viewer when fileUrl is passed', async () => {
    render(<PDFViewer fileUrl={pdfUrl} />);

    expect(await screen.findByTestId('pdf-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer')).toHaveTextContent(`Viewing: ${pdfUrl}`);
  });

  test('uses the fallback URL if fileUrl is not passed', async () => {
    render(<PDFViewer />);

    expect(await screen.findByTestId('pdf-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer')).toHaveTextContent(`Viewing: ${fallbackUrl}`);
  });
});
