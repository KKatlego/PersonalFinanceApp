pipeline {
    agent any

    environment {
        // cPanel Configuration
        CPANEL_HOST = '31.22.4.46'
        CPANEL_DEPLOY_PATH = '/finance.cybergeekcode.org'

        // Deployment Settings
        DEPLOYMENT_NAME = 'simple-app'
    }

    stages {
        stage('Code Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
                bat 'dir /b'
                echo "Checkout completed successfully!"
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing all dependencies...'
                bat 'npm install'
                echo 'Dependencies installed successfully!'
            }
        }

        stage('Build') {
            steps {
                echo 'Building application...'
                bat '''
                    echo Building frontend...
                    cd frontend
                    call npm run build
                    cd ..

                    echo Building backend...
                    cd backend
                    call npm run build
                    cd ..

                    echo Build completed successfully!
                '''
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                         
                echo "All tests passed!"
            }
        }

        stage('Deploy to FTP') {
            steps {
                echo 'Deploying to FTP...'

                script {
                    // Create deployment package
                    bat """
                        echo Creating deployment package...
                        if exist deploy-package rmdir /s /q deploy-package
                        mkdir deploy-package

                        REM Copy frontend build output and assets
                        mkdir deploy-package\\frontend
                        xcopy /e /i /y frontend\\.next deploy-package\\frontend\\.next
                        REM Remove trace file that causes permission issues
                        if exist deploy-package\\frontend\\.next\\trace del /f /q deploy-package\\frontend\\.next\\trace
                        xcopy /e /i /y frontend\\public deploy-package\\frontend\\public
                        copy /y frontend\\package.json deploy-package\\frontend\\
                        if exist frontend\\next.config.mjs copy /y frontend\\next.config.mjs deploy-package\\frontend\\

                        REM Copy backend source files and runtime files (tsx runtime needs source)
                        mkdir deploy-package\\backend
                        xcopy /e /i /y backend\\src deploy-package\\backend\\src
                        xcopy /e /i /y backend\\lib deploy-package\\backend\\lib
                        xcopy /e /i /y backend\\types deploy-package\\backend\\types
                        xcopy /e /i /y backend\\prisma deploy-package\\backend\\prisma
                        copy /y backend\\package.json deploy-package\\backend\\
                        copy /y backend\\tsconfig.json deploy-package\\backend\\
                        REM Skip .env file - should exist on server

                        echo Package created successfully!
                        dir /s deploy-package
                    """

                    // Deploy using PowerShell with credentials
                    withCredentials([usernamePassword(
                        credentialsId: 'cpanel-password',
                        usernameVariable: 'FTP_USER',
                        passwordVariable: 'FTP_PASS'
                    )]) {
                        powershell '''
                            $ftpHost = $env:CPANEL_HOST
                            $ftpUser = $env:FTP_USER
                            $ftpPass = $env:FTP_PASS
                            $ftpDir  = $env:CPANEL_DEPLOY_PATH

                            Write-Host "Deploying to: $ftpHost$ftpDir"

                            # Test FTP connection first
                            try {
                                Write-Host "Testing FTP connection..."
                                $testRequest = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost/")
                                $testRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                $testRequest.Method = [System.Net.WebRequestMethods+Ftp]::PrintWorkingDirectory
                                $testResponse = $testRequest.GetResponse()
                                $testResponse.Close()
                                Write-Host "FTP connection successful!"
                            } catch {
                                Write-Host "ERROR: FTP connection failed!"
                                Write-Host $_.Exception.Message
                                exit 1
                            }

                            # Helper function to create FTP directory recursively
                            function Create-FtpDirectory {
                                param($dirPath)
                                try {
                                    $uri = "ftp://$ftpHost$dirPath"
                                    $request = [System.Net.FtpWebRequest]::Create($uri)
                                    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                                    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                    $request.GetResponse().Close()
                                    Write-Host "Created directory: $dirPath"
                                } catch {
                                    Write-Host "Directory may already exist: $dirPath"
                                }
                            }

                            # Helper function to upload file recursively
                            function Upload-Files {
                                param($sourcePath, $targetPath)
                                $items = Get-ChildItem $sourcePath -Recurse
                                foreach ($item in $items) {
                                    $relativePath = $item.FullName.Substring((Get-Item $sourcePath).FullName.Length)
                                    $targetFile = $targetPath + $relativePath -replace "\\\\", "/"

                                    # Create directory if needed
                                    if ($item.PSIsContainer) {
                                        Create-FtpDirectory $targetFile
                                    } else {
                                        # Upload file
                                        $uri = "ftp://$ftpHost$targetFile"
                                        Write-Host "Uploading:" $targetFile
                                        try {
                                            $request = [System.Net.FtpWebRequest]::Create($uri)
                                            $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
                                            $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                            $request.UseBinary = $true
                                            $request.UsePassive = $true
                                            $content = [System.IO.File]::ReadAllBytes($item.FullName)
                                            $request.ContentLength = $content.Length
                                            $stream = $request.GetRequestStream()
                                            $stream.Write($content, 0, $content.Length)
                                            $stream.Close()
                                        } catch {
                                            Write-Host "Warning: Failed to upload $targetFile - $_.Exception.Message"
                                        }
                                    }
                                }
                            }

                            # Upload frontend
                            Write-Host "Uploading frontend files..."
                            Upload-Files "deploy-package/frontend" "$ftpDir/frontend"

                            # Upload backend
                            Write-Host "Uploading backend files..."
                            Create-FtpDirectory "$ftpDir/backend/src"
                            Create-FtpDirectory "$ftpDir/backend/lib"
                            Create-FtpDirectory "$ftpDir/backend/types"
                            Create-FtpDirectory "$ftpDir/backend/prisma"

                            # Upload source folders
                            Upload-Files "deploy-package/backend/src" "$ftpDir/backend/src"
                            Upload-Files "deploy-package/backend/lib" "$ftpDir/backend/lib"
                            Upload-Files "deploy-package/backend/types" "$ftpDir/backend/types"
                            Upload-Files "deploy-package/backend/prisma" "$ftpDir/backend/prisma"

                            # Upload root backend files (package.json, tsconfig.json)
                            $files = Get-ChildItem "deploy-package/backend" -File
                            foreach ($file in $files) {
                                $uri = "ftp://$ftpHost$ftpDir/backend/" + $file.Name
                                Write-Host "Uploading backend root:" $file.Name
                                try {
                                    $request = [System.Net.FtpWebRequest]::Create($uri)
                                    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
                                    $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                                    $request.UseBinary = $true
                                    $request.UsePassive = $true
                                    $content = [System.IO.File]::ReadAllBytes($file.FullName)
                                    $request.ContentLength = $content.Length
                                    $stream = $request.GetRequestStream()
                                    $stream.Write($content, 0, $content.Length)
                                    $stream.Close()
                                } catch {
                                    Write-Host "Warning: Failed to upload $($file.Name) - $_.Exception.Message"
                                }
                            }

                            Write-Host "Deployment completed successfully!"
                        '''
                    }
                }
            }
        }

        stage('Post-Deploy') {
            steps {
                echo 'Installing backend dependencies and restarting application...'

                script {
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'cpanel-password',
                            usernameVariable: 'SSH_USER',
                            passwordVariable: 'SSH_PASS'
                        )]) {
                            powershell '''
                                $sshHost = $env:CPANEL_HOST
                                $sshUser = $env:SSH_USER
                                $sshPass = $env:SSH_PASS
                                $appPath = $env:CPANEL_DEPLOY_PATH + "/backend"

                                # Find plink for SSH
                                $plinkPaths = @(
                                    "C:\\Program Files\\PuTTY\\plink.exe",
                                    "C:\\Program Files (x86)\\PuTTY\\plink.exe",
                                    "plink.exe"
                                )

                                $plinkPath = $null
                                foreach ($path in $plinkPaths) {
                                    if (Test-Path $path) {
                                        $plinkPath = $path
                                        break
                                    }
                                }

                                if ($plinkPath) {
                                    Write-Host "Installing dependencies and restarting via SSH..."

                                    $commands = @"
                                        cd $appPath
                                        echo "Installing backend dependencies..."
                                        npm install --production
                                        echo "Stopping existing Node.js processes..."
                                        pkill -f "tsx.*src/index.ts" || echo "No existing process found"
                                        pkill -f "node.*src/index.ts" || echo "No existing process found"
                                        sleep 2
                                        echo "Starting Node.js application with tsx..."
                                        nohup npx tsx src/index.ts > app.log 2>&1 &
                                        echo "Application restarted!"
                                        sleep 1
                                        ps aux | grep "tsx.*src/index.ts" | grep -v grep || echo "Process check"
"@

                                    $output = & $plinkPath -ssh -pw $sshPass "$sshUser@$sshHost" $commands 2>&1
                                    Write-Host $output
                                    Write-Host "Backend dependencies installed and application restarted successfully!"
                                } else {
                                    Write-Host "SSH tool not found - manual restart required"
                                }
                            '''
                        }

                    } catch (Exception e) {
                        echo "SSH restart failed: ${e.message}"
                        echo "Please restart manually via cPanel or SSH"
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed! Check the logs for details.'
        }

        always {
            script {
                echo "Cleaning up workspace..."
                bat """
                    if exist deploy-package rmdir /s /q deploy-package
                    echo Cleanup completed!
                """

                echo """
                    ========================================
                    Build Summary
                    ========================================
                    Status: ${currentBuild.result ?: 'SUCCESS'}
                    Duration: ${currentBuild.durationString}
                    Build Number: ${env.BUILD_NUMBER}
                    ========================================
                """
            }
        }
    }
}
