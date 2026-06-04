package com.yomira.document.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.yomira.document.dto.DocumentResponse;
import com.yomira.document.dto.DocumentTextResponse;
import com.yomira.document.entity.Document;
import com.yomira.document.repository.DocumentRepository;
import com.yomira.document.service.DocumentService;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;


@Service
@Slf4j
public class DocumentServiceImpl implements DocumentService{

	@Autowired
	DocumentRepository documentRepository;

	@Override
	public DocumentResponse upload(MultipartFile file) throws IOException{
		Document document = new Document();
		document.setFileName(file.getOriginalFilename());
		document.setContentType(file.getContentType());
		document.setFileSize(file.getSize());
		document.setUploadedAt(LocalDateTime.now());

		String content = getPdfContent(file.getInputStream());
		document.setExtractedText(content);

		int pageCount = getPdfPages(file);
		document.setPageCount(pageCount);

		document.setFileData(file.getBytes());

		documentRepository.save(document);

		Long generatedId = document.getDocumentId();

		return DocumentResponse.builder()
				.id(generatedId)
				.filename(document.getFileName())
				.contentType(document.getContentType())
				.fileSize(document.getFileSize())
				.status("UPLOADED")
				.uploadedAt(document.getUploadedAt())
				.build();
	}

	@Override
	public DocumentResponse getDocument(@NonNull Long id) {
		Document document = documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document Not Found!"));
		return DocumentResponse.builder()
				.id(document.getDocumentId())
				.filename(document.getFileName())
				.contentType(document.getContentType())
				.fileSize(document.getFileSize())
				.status("UPLOADED")
				.uploadedAt(document.getUploadedAt())
				.build();
	}

	@Override
	public DocumentTextResponse getExtractedText(@NonNull Long id) {
		Document document = documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document Not Found!"));
		return DocumentTextResponse.builder()
				.id(document.getDocumentId())
				.text(document.getExtractedText())
				.pageCount(document.getPageCount())
				.build();
	}

	private String getPdfContent(InputStream inputStream) throws IOException{
		try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
	}

	private int getPdfPages(MultipartFile file) throws IOException{
		try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            return document.getNumberOfPages();
        }
	}

}
