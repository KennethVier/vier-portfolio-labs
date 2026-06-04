package com.yomira.document.controller;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.yomira.document.dto.DocumentResponse;
import com.yomira.document.dto.DocumentTextResponse;
import com.yomira.document.service.DocumentService;

@RestController
@RequestMapping("/api/document")
public class DocumentController {
	
	@Autowired
	DocumentService documentService;
	
	@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<DocumentResponse> uploadPdfFile(@RequestParam("file") MultipartFile file) throws IOException{
		DocumentResponse response = documentService.upload(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<DocumentResponse> getMetaData(@PathVariable Long id){
		DocumentResponse response = documentService.getDocument(id);
        return ResponseEntity.ok(response);
	}
	
	@GetMapping("/{id}/text")
	public ResponseEntity<DocumentTextResponse> getText(@PathVariable Long id){
		DocumentTextResponse textResponse = documentService.getExtractedText(id);
        return ResponseEntity.ok(textResponse);
	}
}
