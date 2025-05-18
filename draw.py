from graphviz import Digraph

# Khởi tạo đồ thị
dot = Digraph(comment='Sơ đồ quy trình nhận diện cảm xúc từ giọng nói', 
              format='png')
dot.attr('node', shape='box', style='filled', fillcolor='white', 
         fontname='Arial', fontsize='12')
dot.attr('edge', fontname='Arial', fontsize='10')
dot.attr(rankdir='TB', size='8,8')

# Giai đoạn chuẩn bị dữ liệu và huấn luyện
dot.node('A1', 'Tạo tập âm thanh\nNegative')
dot.node('A2', 'Tạo tập âm thanh\nPositive')
dot.node('B2', 'Trích xuất đặc trưng\nâm thanh')
dot.node('C1', 'Tiền xử lý âm thanh\ntập mẫu')
dot.node('D1', 'Training model\nnhận diện cảm xúc')

# Giai đoạn nhận diện
dot.node('A3', 'Âm thanh cần\nnhận dạng')
dot.node('B3', 'Ghi âm và số hóa\ntín hiệu')
dot.node('C3', 'Tiền xử lý\ntín hiệu')
dot.node('D3', 'Xác minh\ntín hiệu', shape='diamond')
dot.node('E3', 'Loại')
dot.node('F3', 'Trích xuất đặc trưng\nMFCC')
dot.node('G3', 'Phân tích phổ\ntần số')
dot.node('H3', 'Đối chiếu với\nmodel')
dot.node('I3', 'Nhận diện cảm xúc\ntừ giọng nói')

# Thêm các mũi tên
dot.edge('A1', 'C1')
dot.edge('A2', 'B2')
dot.edge('B2', 'C1')
dot.edge('C1', 'D1')
dot.edge('A3', 'B3')
dot.edge('B3', 'C3')
dot.edge('C3', 'D3')
dot.edge('D1', 'D3')
dot.edge('D3', 'E3', label='Không hợp lệ')
dot.edge('D3', 'F3', label='Hợp lệ')
dot.edge('F3', 'G3')
dot.edge('G3', 'H3')
dot.edge('H3', 'I3')

# Lưu và hiển thị đồ thị
dot.render('voice_emotion_detection_flowchart', view=True)
print(dot.source)  # In ra mã nguồn DOT để có thể sử dụng lại nếu cần