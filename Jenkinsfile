pipeline {
    agent any

    environment {
        CPANEL_HOST = '31.22.4.46'
        CPANEL_DEPLOY_PATH = '/finance.cybergeekcode.org'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                bat 'cd frontend && npm run build && cd ..'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'cpanel-password',
                        usernameVariable: 'FTP_USER',
                        passwordVariable: 'FTP_PASS'
                    )]) {
                        powershell '''
                            $ftpHost = $env:CPANEL_HOST
                            $ftpUser = $env:FTP_USER
                            $ftpPass = $env:FTP_PASS
                            $ftpDir = $env:CPANEL_DEPLOY_PATH

                            # FTP helper functions
                            function Create-FtpDir {
                                param($path)
                                try {
                                    $req = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost$path")
                                    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                                    $req.GetResponse().Close() | Out-Null
                                } catch {}
                            }

                            function Upload-File {
                                param($local, $remote)
                                try {
                                    $req = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost$remote")
                                    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
                                    $req.UseBinary = $true
                                    $content = [System.IO.File]::ReadAllBytes($local)
                                    $req.ContentLength = $content.Length
                                    $str = $req.GetRequestStream()
                                    $str.Write($content, 0, $content.Length)
                                    $str.Close()
                                    Write-Host "OK: $remote"
                                } catch {
                                    Write-Host "SKIP: $remote"
                                }
                            }

                            function Upload-Folder {
                                param($src, $dst)
                                Create-FtpDir $dst
                                Get-ChildItem $src -Recurse | ForEach-Object {
                                    $rel = $_.FullName.Substring((Get-Item $src).FullName.Length) -replace '\\\\', '/'
                                    $rem = "$dst$rel"
                                    if ($_.PSIsContainer) {
                                        Create-FtpDir "$rem/"
                                    } else {
                                        Upload-File $_.FullName $rem
                                    }
                                }
                            }

                            # Test connection
                            try {
                                $req = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost/")
                                $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                $req.Method = [System.Net.WebRequestMethods+Ftp]::PrintWorkingDirectory
                                $req.GetResponse().Close() | Out-Null
                            } catch {
                                Write-Host "FTP Connection Failed!"
                                exit 1
                            }

                            # Upload frontend (static export)
                            Write-Host "=== Uploading frontend ==="
                            Upload-Folder "frontend/out" "$ftpDir/"
                            Upload-Folder "frontend/public" "$ftpDir/"

                            # Upload backend
                            Write-Host "=== Uploading backend ==="
                            Create-FtpDir "$ftpDir/backend"
                            robocopy backend deploy-package\backend /E /XD node_modules .next dist /NFL /NDL /NJH /NJS
                            Get-ChildItem deploy-package\backend -Recurse | ForEach-Object {
                                $rel = $_.FullName.Substring((Get-Item deploy-package\backend).FullName.Length) -replace '\\\\', '/'
                                $rem = "$ftpDir/backend$rel"
                                if ($_.PSIsContainer) {
                                    Create-FtpDir "$rem/"
                                } else {
                                    Upload-File $_.FullName $rem
                                }
                            }

                            Write-Host "=== Done ==="
                        '''
                    }
                }
            }
        }

        stage('Start Backend') {
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'cpanel-password',
                            usernameVariable: 'SSH_USER',
                            passwordVariable: 'SSH_PASS'
                        )]) {
                            powershell '''
                                $plink = "C:\\Program Files\\PuTTY\\plink.exe"
                                if (-not (Test-Path $plink)) { $plink = "plink.exe" }
                                if (Test-Path $plink) {
                                    $cmd = @"
                                        cd /finance.cybergeekcode.org/backend
                                        npm install --production --silent 2>&1
                                        pkill -f "tsx.*index" || true
                                        nohup npx tsx src/index.ts > app.log 2>&1 &
                                        echo Started
"@
                                    & $plink -ssh -pw $env:SSH_PASS "$env:SSH_USER@$env:CPANEL_HOST" $cmd 2>&1
                                }
                            '''
                        }
                    } catch {
                        echo "Backend start skipped (no SSH)"
                    }
                }
            }
        }
    }

    post {
        always {
            bat 'if exist deploy-package rmdir /s /q deploy-package 2>nul'
        }
    }
}
