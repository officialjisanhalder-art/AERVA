class VaultDocument {
  final String id;
  final String title;
  final String category;
  final String doctorName;
  final String date;
  final String fileType;
  final String fileName;
  final String fileSize;
  final String? localPath;
  final String notes;

  VaultDocument({
    required this.id,
    required this.title,
    required this.category,
    required this.doctorName,
    required this.date,
    required this.fileType,
    required this.fileName,
    required this.fileSize,
    this.localPath,
    required this.notes,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'category': category,
    'doctorName': doctorName,
    'date': date,
    'fileType': fileType,
    'fileName': fileName,
    'fileSize': fileSize,
    'localPath': localPath,
    'notes': notes,
  };

  factory VaultDocument.fromMap(Map<String, dynamic> map) => VaultDocument(
    id: map['id'] ?? '',
    title: map['title'] ?? '',
    category: map['category'] ?? 'Prescription',
    doctorName: map['doctorName'] ?? '',
    date: map['date'] ?? '',
    fileType: map['fileType'] ?? 'pdf',
    fileName: map['fileName'] ?? '',
    fileSize: map['fileSize'] ?? '',
    localPath: map['localPath'],
    notes: map['notes'] ?? '',
  );
}
