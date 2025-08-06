// Webpack 설정 파일 (선택사항)
// 더 고급 번들링이 필요한 경우 사용

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  
  entry: {
    main: './assets/js/main.js',
    admin: './assets/css/admin.css'
  },
  
  output: {
    path: path.resolve(__dirname, '../dist/assets'),
    filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
    chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
    clean: true,
    publicPath: '/admin/assets/'
  },
  
  module: {
    rules: [
      // JavaScript 처리
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions', 'not ie 11']
                },
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      },
      
      // CSS 처리
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                  ...(isProduction ? [['cssnano']] : [])
                ]
              }
            }
          }
        ]
      },
      
      // 이미지 처리
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[contenthash:8][ext]'
        }
      },
      
      // 폰트 처리
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      }
    ]
  },
  
  plugins: [
    // CSS 추출
    new MiniCssExtractPlugin({
      filename: isProduction ? 'css/[name].[contenthash:8].css' : 'css/[name].css',
      chunkFilename: isProduction ? 'css/[name].[contenthash:8].chunk.css' : 'css/[name].chunk.css'
    }),
    
    // 번들 분석 (필요시)
    ...(isAnalyze ? [new BundleAnalyzerPlugin()] : [])
  ],
  
  optimization: {
    minimize: isProduction,
    minimizer: [
      // JavaScript 최소화
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      }),
      
      // CSS 최소화
      new CssMinimizerPlugin()
    ],
    
    // 코드 분할
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    
    // 런타임 청크 분리
    runtimeChunk: {
      name: 'runtime'
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../assets'),
      '@modules': path.resolve(__dirname, '../assets/js/modules'),
      '@css': path.resolve(__dirname, '../assets/css')
    },
    extensions: ['.js', '.css']
  },
  
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  
  devServer: {
    static: {
      directory: path.join(__dirname, '..')
    },
    compress: true,
    port: 8080,
    hot: true,
    open: '/admin/',
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/admin/index.html' }
      ]
    }
  },
  
  // 성능 힌트
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 250000,
    maxAssetSize: 250000
  },
  
  // 통계 설정
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }
};

// 환경별 설정 조정
if (process.env.GITHUB_PAGES) {
  // GitHub Pages 배포용 설정
  module.exports.output.publicPath = '/repository-name/admin/assets/';
}

// 개발 환경 전용 설정
if (!isProduction) {
  module.exports.plugins.push(
    // 개발 환경에서 유용한 플러그인들
  );
}