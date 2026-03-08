$source = "C:\Users\Cunae\Downloads\NativeTalk-master (2)\NativeTalk-master\frontend_new"
$destination = "C:\Users\Cunae\Downloads\NativeTalk-master (2)\NativeTalk-master\frontend_new_archive"

if (Test-Path $source) {
    Write-Host "Archiving frontend_new..."
    Move-Item -Path $source -Destination $destination -Force
    Write-Host "Archive complete: $destination"
} else {
    Write-Host "frontend_new not found, nothing to archive."
}
